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

    private var authSession: ASWebAuthenticationSession?

    private static let canceledLoginRawValue = ASWebAuthenticationSessionError.Code.canceledLogin.rawValue

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

    /// OAuth error in redirect URL, e.g. ?error=access_denied&error_description=...
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
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let authURL = URL(string: urlString) else {
            call.reject("Missing or invalid url")
            return
        }
        let scheme = call.getString("callbackScheme") ?? "lovequest"

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.authSession = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: scheme
            ) { callbackURL, error in
                defer { self.authSession = nil }

                self.logAuthSessionCallback(callbackURL: callbackURL, error: error)

                // Prefer callback URL even when error is also set (avoid false cancel).
                if let callbackURL = callbackURL {
                    if let oauthError = self.oauthErrorFromCallbackURL(callbackURL) {
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
                        return
                    }
                    self.resolveSuccess(callbackURL: callbackURL, call: call)
                    return
                }

                if let error = error {
                    if self.isAuthSessionCanceled(error) {
                        NSLog("[LQ_AUTH] ASWebAuthenticationSession user canceled (canceledLogin)")
                        call.reject("User canceled", "CANCELED")
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
                    return
                }

                NSLog("[LQ_AUTH] ASWebAuthenticationSession no callback URL and no error")
                call.reject("No callback URL", "NO_CALLBACK")
            }

            self.authSession?.presentationContextProvider = self
            self.authSession?.prefersEphemeralWebBrowserSession = false

            if self.authSession?.start() != true {
                NSLog("[LQ_AUTH] ASWebAuthenticationSession start() returned false")
                call.reject("Failed to start authentication session", "START_FAILED")
            }
        }
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        if let window = self.bridge?.viewController?.view.window {
            return window
        }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.flatMap { $0.windows }.first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
