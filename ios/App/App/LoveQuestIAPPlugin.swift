import Foundation
import Capacitor
import StoreKit

@objc(LoveQuestIAPPlugin)
public class LoveQuestIAPPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "LoveQuestIAPPlugin"
    public let jsName = "LoveQuestIAP"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise),
    ]

    private static let monthlyId = "com.wayne.lovequest.pro.monthly"
    private static let yearlyId = "com.wayne.lovequest.pro.yearly"
    private static let productIds: Set<String> = [monthlyId, yearlyId]

    private var cachedProducts: [String: Product] = [:]

    private func period(for productId: String) -> String {
        productId == Self.yearlyId ? "yearly" : "monthly"
    }

    private func entitlementPayload(from transaction: Transaction) -> [String: Any] {
        var payload: [String: Any] = [
            "productId": transaction.productID,
            "period": period(for: transaction.productID),
            "isActive": true,
            "originalTransactionId": String(transaction.originalID),
            "transactionId": String(transaction.id),
        ]
        if let expiration = transaction.expirationDate {
            payload["expiresAt"] = ISO8601DateFormatter().string(from: expiration)
        } else {
            payload["expiresAt"] = NSNull()
        }
        return payload
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }

    private func loadProducts() async throws -> [Product] {
        let products = try await Product.products(for: Self.productIds)
        cachedProducts = Dictionary(uniqueKeysWithValues: products.map { ($0.id, $0) })
        return products
    }

    private func product(for productId: String) async throws -> Product {
        if let cached = cachedProducts[productId] {
            return cached
        }
        _ = try await loadProducts()
        guard let product = cachedProducts[productId] else {
            throw NSError(
                domain: "LoveQuestIAP",
                code: 404,
                userInfo: [NSLocalizedDescriptionKey: "Product not found: \(productId)"]
            )
        }
        return product
    }

    private func activeEntitlement() async -> [String: Any]? {
        var best: (Transaction, Date?)?
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }
            guard Self.productIds.contains(transaction.productID) else { continue }
            if transaction.revocationDate != nil { continue }
            let exp = transaction.expirationDate
            if let exp = exp, exp < Date() { continue }
            if let current = best {
                let currentExp = current.1 ?? .distantFuture
                let newExp = exp ?? .distantFuture
                if newExp > currentExp {
                    best = (transaction, exp)
                }
            } else {
                best = (transaction, exp)
            }
        }
        guard let transaction = best?.0 else { return nil }
        return entitlementPayload(from: transaction)
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        NSLog("[LQ_IAP] getProducts.start")
        Task {
            do {
                let products = try await self.loadProducts()
                let list: [[String: Any]] = products.map { product in
                    [
                        "productId": product.id,
                        "displayPrice": product.displayPrice,
                        "period": self.period(for: product.id),
                    ]
                }
                NSLog("[LQ_IAP] getProducts.success count=%ld", list.count)
                call.resolve(["products": list])
            } catch {
                NSLog("[LQ_IAP] getProducts.error %@", error.localizedDescription)
                call.reject(error.localizedDescription, "PRODUCTS_FAILED", error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId", "INVALID_ARGS")
            return
        }
        call.keepAlive = true
        NSLog("[LQ_IAP] purchase.start productId=%@", productId)

        Task {
            defer { call.keepAlive = false }
            do {
                let product = try await self.product(for: productId)
                let purchaseResult = try await product.purchase()

                switch purchaseResult {
                case .success(let verification):
                    let transaction = try self.checkVerified(verification)
                    await transaction.finish()
                    if let entitlement = await self.activeEntitlement() {
                        NSLog("[LQ_IAP] purchase.success productId=%@", productId)
                        call.resolve(entitlement)
                    } else {
                        call.resolve(self.entitlementPayload(from: transaction))
                    }
                case .userCancelled:
                    NSLog("[LQ_IAP] purchase.canceled")
                    call.reject("User canceled", "CANCELED")
                case .pending:
                    NSLog("[LQ_IAP] purchase.pending")
                    call.reject("Purchase pending approval", "PENDING")
                @unknown default:
                    call.reject("Unknown purchase result", "UNKNOWN")
                }
            } catch {
                NSLog("[LQ_IAP] purchase.error %@", error.localizedDescription)
                call.reject(error.localizedDescription, "PURCHASE_FAILED", error)
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        call.keepAlive = true
        NSLog("[LQ_IAP] restore.start")
        Task {
            defer { call.keepAlive = false }
            do {
                try await AppStore.sync()
                if let entitlement = await self.activeEntitlement() {
                    NSLog("[LQ_IAP] restore.success")
                    call.resolve(entitlement)
                } else {
                    NSLog("[LQ_IAP] restore.no_entitlements")
                    call.reject("No active subscription found", "NO_PURCHASES")
                }
            } catch {
                NSLog("[LQ_IAP] restore.error %@", error.localizedDescription)
                call.reject(error.localizedDescription, "RESTORE_FAILED", error)
            }
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        NSLog("[LQ_IAP] getEntitlements.start")
        Task {
            if let entitlement = await self.activeEntitlement() {
                NSLog("[LQ_IAP] getEntitlements.active productId=%@", entitlement["productId"] as? String ?? "")
                call.resolve(entitlement)
            } else {
                NSLog("[LQ_IAP] getEntitlements.none")
                call.resolve(["isActive": false])
            }
        }
    }
}
