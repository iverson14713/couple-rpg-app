import Capacitor

/**
 * Registers LoveQuest local Capacitor plugins after bridge load.
 * `cap sync ios` only scans node_modules and overwrites packageClassList — these plugins
 * live in the App target, so we register them here as a fallback.
 */
class MainBridgeViewController: CAPBridgeViewController {

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        registerLoveQuestLocalPlugins()
    }

    private func registerLoveQuestLocalPlugins() {
        let plugins: [CAPPlugin & CAPBridgedPlugin] = [
            LoveQuestOAuthPlugin(),
            LoveQuestAppleSignInPlugin(),
            LoveQuestIAPPlugin(),
            LoveQuestWidgetBridgePlugin(),
        ]
        for plugin in plugins {
            bridge?.registerPluginInstance(plugin)
            NSLog("[LQ_NATIVE] registered local plugin jsName=%@", plugin.jsName)
        }
    }
}
