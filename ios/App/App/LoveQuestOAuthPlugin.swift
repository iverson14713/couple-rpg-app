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

                if let error = error as? ASWebAuthenticationSessionError, error.code == .canceled {
                    call.reject("User canceled", "CANCELED")
                    return
                }
                if let error = error {
                    call.reject(error.localizedDescription)
                    return
                }
                guard let callbackURL = callbackURL else {
                    call.reject("No callback URL")
                    return
                }

                NSLog("[LQ_AUTH] ASWebAuthenticationSession callback: %@", callbackURL.absoluteString)

                NotificationCenter.default.post(
                    name: .capacitorOpenURL,
                    object: [
                        "url": callbackURL as NSURL,
                        "options": [UIApplication.OpenURLOptionsKey: Any]()
                    ]
                )

                call.resolve(["url": callbackURL.absoluteString])
            }

            self.authSession?.presentationContextProvider = self
            self.authSession?.prefersEphemeralWebBrowserSession = false

            if self.authSession?.start() != true {
                call.reject("Failed to start authentication session")
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
