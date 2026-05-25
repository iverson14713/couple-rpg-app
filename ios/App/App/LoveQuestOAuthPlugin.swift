import Foundation
import UIKit
import Capacitor
import AuthenticationServices

/**
 * OAuth via ASWebAuthenticationSession — required for lovequest://auth/callback on iOS.
 * SFSafariViewController (Capacitor Browser) does not return custom URL schemes to the app.
 */
@objc(LoveQuestOAuthPlugin)
public class LoveQuestOAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {

    public let identifier = "LoveQuestOAuthPlugin"
    public let jsName = "LoveQuestOAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise)
    ]

    /// Strong reference — must outlive async OAuth (do not use a local variable).
    private var authSession: ASWebAuthenticationSession?
    /// Keep plugin call alive until resolve/reject.
    private var pendingAuthenticateCall: CAPPluginCall?

    private static let canceledLoginRawValue = ASWebAuthenticationSessionError.Code.canceledLogin.rawValue

    private func runOnMain(_ work: @escaping () -> Void) {
        if Thread.isMainThread {
            work()
        } else {
            DispatchQueue.main.async(execute: work)
        }
    }

    /// Only true for explicit user dismissal (canceledLogin / rawValue 1).
    private func isAuthSessionCanceled(_ error: Error) -> Bool {
        if let authError = error as? ASWebAuthenticationSessionError {
            return authError.code == .canceledLogin || authError.code.rawValue == Self.canceledLoginRawValue
        }
        let ns = error as NSError
        return ns.domain == ASWebAuthenticationSessionError.errorDomain
            && ns.code == Self.canceledLoginRawValue
    }

    private func logAuthSessionCallback(callbackURL: URL?, error: Error?) {
        let urlString = callbackURL?.absoluteString ?? "(nil)"
        NSLog("[LQ_AUTH] ASWebAuthenticationSession callbackURL=%@", urlString)

        guard let error = error else {
            NSLog("[LQ_AUTH] ASWebAuthenticationSession error=(nil)")
            return
        }

        NSLog("[LQ_AUTH] ASWebAuthenticationSession error.localizedDescription=%@", error.localizedDescription)
        let ns = error as NSError
        NSLog("[LQ_AUTH] ASWebAuthenticationSession error domain=%@ code=%ld", ns.domain, ns.code)
        if !ns.userInfo.isEmpty {
            NSLog("[LQ_AUTH] ASWebAuthenticationSession error.userInfo=%@", String(describing: ns.userInfo))
        }
        if let authError = error as? ASWebAuthenticationSessionError {
            NSLog(
                "[LQ_AUTH] ASWebAuthenticationSessionError.code rawValue=%ld canceledLoginRaw=%ld isCanceled=%@",
                authError.code.rawValue,
                Self.canceledLoginRawValue,
                isAuthSessionCanceled(error) ? "YES" : "NO"
            )
        }
    }

    private func oauthErrorFromCallbackURL(_ url: URL) -> (code: String, description: String)? {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return nil
        }
        let items = components.queryItems ?? []
        func queryValue(_ name: String) -> String? {
            items.first(where: { $0.name == name })?.value?.removingPercentEncoding
        }
        let code = queryValue("error") ?? queryValue("error_code")
        let description = queryValue("error_description") ?? queryValue("error_message") ?? ""
        guard let code = code, !code.isEmpty else { return nil }
        return (code, description)
    }

    private func finishPendingCall(_ call: CAPPluginCall) {
        call.keepAlive = false
        pendingAuthenticateCall = nil
    }

    private func resolveSuccess(callbackURL: URL, call: CAPPluginCall) {
        NSLog("[LQ_AUTH] ASWebAuthenticationSession success redirect=%@", callbackURL.absoluteString)

        NotificationCenter.default.post(
            name: .capacitorOpenURL,
            object: [
                "url": callbackURL as NSURL,
                "options": [UIApplication.OpenURLOptionsKey: Any]()
            ]
        )

        call.resolve(["url": callbackURL.absoluteString])
        finishPendingCall(call)
    }

    private func handleAuthSessionCompletion(
        callbackURL: URL?,
        error: Error?,
        call: CAPPluginCall
    ) {
        logAuthSessionCallback(callbackURL: callbackURL, error: error)

        if let callbackURL = callbackURL {
            if let oauthError = oauthErrorFromCallbackURL(callbackURL) {
                NSLog(
                    "[LQ_AUTH] OAuth callback URL error code=%@ error_description=%@",
                    oauthError.code,
                    oauthError.description
                )
                call.reject(
                    oauthError.description.isEmpty ? oauthError.code : oauthError.description,
                    "OAUTH_ERROR",
                    nil,
                    [
                        "error": oauthError.code,
                        "error_description": oauthError.description
                    ]
                )
                finishPendingCall(call)
                return
            }
            resolveSuccess(callbackURL: callbackURL, call: call)
            return
        }

        if let error = error {
            if isAuthSessionCanceled(error) {
                NSLog("[LQ_AUTH] ASWebAuthenticationSession user canceled (canceledLogin)")
                call.reject("User canceled", "CANCELED")
                finishPendingCall(call)
                return
            }
            let ns = error as NSError
            NSLog(
                "[LQ_AUTH] ASWebAuthenticationSession failed (not cancel) domain=%@ code=%ld",
                ns.domain,
                ns.code
            )
            call.reject(
                error.localizedDescription,
                "OAUTH_ERROR",
                error,
                ["domain": ns.domain, "code": String(ns.code)]
            )
            finishPendingCall(call)
            return
        }

        NSLog("[LQ_AUTH] ASWebAuthenticationSession no callback URL and no error")
        call.reject("No callback URL", "NO_CALLBACK")
        finishPendingCall(call)
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        call.keepAlive = true
        pendingAuthenticateCall = call

        guard let urlString = call.getString("url"),
              let authURL = URL(string: urlString) else {
            NSLog("[LQ_AUTH] LoveQuestOAuth.authenticate invalid url")
            call.reject("Missing or invalid url", "INVALID_URL")
            finishPendingCall(call)
            return
        }
        let scheme = call.getString("callbackScheme") ?? "lovequest"
        NSLog("[LQ_AUTH] LoveQuestOAuth.authenticate.start url=%@ scheme=%@", urlString, scheme)

        runOnMain { [weak self] in
            guard let self = self else {
                NSLog("[LQ_AUTH] LoveQuestOAuth.authenticate plugin deallocated before main")
                call.reject("Plugin unavailable", "PLUGIN_UNAVAILABLE")
                call.keepAlive = false
                return
            }

            if let existing = self.authSession {
                NSLog("[LQ_AUTH] canceling previous ASWebAuthenticationSession")
                existing.cancel()
                self.authSession = nil
            }

            let session = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: scheme
            ) { [weak self] callbackURL, error in
                NSLog("[LQ_AUTH] ASWebAuthenticationSession completion handler invoked")
                DispatchQueue.main.async {
                    guard let self = self else {
                        NSLog("[LQ_AUTH] completion: plugin deallocated")
                        call.reject("Plugin unavailable after OAuth", "PLUGIN_UNAVAILABLE")
                        call.keepAlive = false
                        return
                    }
                    self.authSession = nil
                    self.handleAuthSessionCompletion(
                        callbackURL: callbackURL,
                        error: error,
                        call: call
                    )
                }
            }

            self.authSession = session
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false

            let started = session.start()
            NSLog("[LQ_AUTH] ASWebAuthenticationSession.start result=%@", started ? "true" : "false")

            if !started {
                self.authSession = nil
                call.reject("Failed to start authentication session", "START_FAILED")
                self.finishPendingCall(call)
            }
        }
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        if let window = bridge?.viewController?.view.window {
            return window
        }
        if let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first(where: { $0.isKeyWindow }) {
            return window
        }
        NSLog("[LQ_AUTH] presentationAnchor: bridge window missing, using first window")
        return UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first ?? ASPresentationAnchor()
    }
}
