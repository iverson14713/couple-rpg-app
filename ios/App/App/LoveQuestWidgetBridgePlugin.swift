import Foundation
import Capacitor
import WidgetKit

@objc(LoveQuestWidgetBridgePlugin)
public class LoveQuestWidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "LoveQuestWidgetBridgePlugin"
    public let jsName = "LoveQuestWidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveWidgetData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadWidget", returnType: CAPPluginReturnPromise),
    ]

    @objc func saveWidgetData(_ call: CAPPluginCall) {
        let raw = call.options ?? [:]
        var data: [String: Any] = [:]
        for (key, value) in raw {
            if let keyString = key as? String {
                data[keyString] = value
            }
        }
        if data.isEmpty {
            call.reject("[LQ_WIDGET_NATIVE] missing widget data")
            return
        }
        if data["updatedAt"] == nil {
            data["updatedAt"] = Date().timeIntervalSince1970 * 1000
        }
        LoveQuestWidgetStore.savePayload(data)
        call.resolve()
    }

    @objc func reloadWidget(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            NSLog("[LQ_WIDGET] reloadAllTimelines requested")
        }
        call.resolve()
    }
}
