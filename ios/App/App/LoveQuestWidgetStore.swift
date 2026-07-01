import Foundation

enum LoveQuestWidgetStore {
    static let appGroupId = "group.com.wayne.lovequest"
    static let dataKey = "lovequest_widget_data"

    static func savePayload(_ json: [String: Any]) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            NSLog("[LQ_WIDGET] save failed: App Group unavailable")
            return
        }
        do {
            let data = try JSONSerialization.data(withJSONObject: json, options: [])
            guard let text = String(data: data, encoding: .utf8) else { return }
            defaults.set(text, forKey: dataKey)
            NSLog("[LQ_WIDGET_NATIVE] saved to App Group (%ld bytes)", text.count)
        } catch {
            NSLog("[LQ_WIDGET] save encode error: %@", error.localizedDescription)
        }
    }
}
