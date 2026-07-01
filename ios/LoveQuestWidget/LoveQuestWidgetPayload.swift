import Foundation

struct LoveQuestWidgetPayload: Codable {
    var coupleName: String
    var togetherTitle: String
    var togetherDays: Int
    var nextEventTitle: String?
    var nextEventDaysLeft: Int?
    var nextEventDateLabel: String?
    var flameDays: Int
    var isPro: Bool?
    var updatedAt: Double
    var hasData: Bool
    var hasInteractedToday: Bool?
    var lastInteractionDate: String?
    var relationshipStartDate: String?
    var nextImportantAnnualYmd: String?
    var nextImportantTitle: String?
    var todayInteractionDate: String?
    var isLoggedIn: Bool?
    var isCoupleBound: Bool?

    static let empty = LoveQuestWidgetPayload(
        coupleName: "LoveQuest",
        togetherTitle: "我們在一起",
        togetherDays: 0,
        nextEventTitle: nil,
        nextEventDaysLeft: nil,
        nextEventDateLabel: nil,
        flameDays: 0,
        isPro: nil,
        updatedAt: 0,
        hasData: false,
        hasInteractedToday: false,
        lastInteractionDate: nil,
        relationshipStartDate: nil,
        nextImportantAnnualYmd: nil,
        nextImportantTitle: nil,
        todayInteractionDate: nil,
        isLoggedIn: false,
        isCoupleBound: false
    )

    var resolvedXiaoi: XiaoiResolvedState {
        resolvedXiaoi(at: Date())
    }

    func resolvedXiaoi(at date: Date) -> XiaoiResolvedState {
        LoveQuestXiaoiState.resolve(payload: self, at: date)
    }

    func materialized(at date: Date = Date()) -> LoveQuestWidgetMaterialized {
        LoveQuestWidgetMaterialized(payload: self, at: date)
    }
}

struct LoveQuestWidgetMaterialized {
    let payload: LoveQuestWidgetPayload
    let at: Date
    let togetherDays: Int
    let nextEventTitle: String?
    let nextEventDaysLeft: Int?
    let xiaoi: XiaoiResolvedState

    init(payload: LoveQuestWidgetPayload, at: Date) {
        self.payload = payload
        self.at = at
        self.togetherDays = LoveQuestWidgetDateMath.togetherDays(
            relationshipStartDate: payload.relationshipStartDate,
            fallback: payload.togetherDays,
            at: at
        )
        let annualYmd = payload.nextImportantAnnualYmd
        let annualTitle = payload.nextImportantTitle ?? payload.nextEventTitle
        if let annualYmd, !annualYmd.isEmpty, let daysLeft = LoveQuestWidgetDateMath.daysUntilAnnual(ymd: annualYmd, at: at) {
            self.nextEventTitle = annualTitle
            self.nextEventDaysLeft = daysLeft
        } else if let title = payload.nextEventTitle, let left = payload.nextEventDaysLeft {
            self.nextEventTitle = title
            self.nextEventDaysLeft = left
        } else {
            self.nextEventTitle = annualTitle
            self.nextEventDaysLeft = nil
        }
        self.xiaoi = payload.resolvedXiaoi(at: at)
    }
}

enum LoveQuestWidgetDateMath {
    private static let ymdFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar.current
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    static func ymdString(from date: Date, calendar: Calendar = .current) -> String {
        let comps = calendar.dateComponents([.year, .month, .day], from: date)
        let y = comps.year ?? 0
        let m = comps.month ?? 0
        let d = comps.day ?? 0
        return String(format: "%04d-%02d-%02d", y, m, d)
    }

    static func parseYmd(_ raw: String?) -> Date? {
        guard let raw, !raw.isEmpty else { return nil }
        return ymdFormatter.date(from: raw)
    }

    static func startOfDay(_ date: Date, calendar: Calendar = .current) -> Date {
        calendar.date(from: calendar.dateComponents([.year, .month, .day], from: date)) ?? date
    }

    static func togetherDays(relationshipStartDate: String?, fallback: Int, at date: Date) -> Int {
        guard let start = parseYmd(relationshipStartDate) else { return max(0, fallback) }
        let calendar = Calendar.current
        let startDay = startOfDay(start, calendar: calendar)
        let refDay = startOfDay(date, calendar: calendar)
        let diff = calendar.dateComponents([.day], from: startDay, to: refDay).day ?? -1
        if diff < 0 { return 0 }
        return diff + 1
    }

    static func daysUntilAnnual(ymd: String, at date: Date) -> Int? {
        guard let anchor = parseYmd(ymd) else { return nil }
        let calendar = Calendar.current
        let anchorComps = calendar.dateComponents([.month, .day], from: anchor)
        guard let month = anchorComps.month, let day = anchorComps.day else { return nil }
        let year = calendar.component(.year, from: date)
        var best: Int?
        for y in [year, year + 1] {
            var comps = DateComponents(year: y, month: month, day: day)
            guard let target = calendar.date(from: comps) else { continue }
            let targetDay = startOfDay(target, calendar: calendar)
            let refDay = startOfDay(date, calendar: calendar)
            let diff = calendar.dateComponents([.day], from: refDay, to: targetDay).day ?? 999
            if diff >= 0 {
                if best == nil || diff < best! { best = diff }
            }
        }
        return best
    }

    static func hasInteractedToday(payload: LoveQuestWidgetPayload, at date: Date) -> Bool {
        let today = ymdString(from: date)
        if let interaction = payload.todayInteractionDate, interaction == today { return true }
        if let last = payload.lastInteractionDate, last == today { return true }
        return false
    }

    static func nextMidnightRefresh(after date: Date, calendar: Calendar = .current) -> Date? {
        let start = startOfDay(date, calendar: calendar)
        guard let tomorrow = calendar.date(byAdding: .day, value: 1, to: start) else { return nil }
        return calendar.date(bySettingHour: 0, minute: 5, second: 0, of: tomorrow)
    }
}

enum LoveQuestWidgetTimelineBuilder {
    static func refreshDates(from now: Date = Date(), calendar: Calendar = .current) -> [Date] {
        var dates: [Date] = []
        for hourOffset in 0...3 {
            if let d = calendar.date(byAdding: .hour, value: hourOffset, to: now) {
                dates.append(d)
            }
        }
        if let midnight = LoveQuestWidgetDateMath.nextMidnightRefresh(after: now, calendar: calendar) {
            dates.append(midnight)
        }
        return dates.sorted()
    }

    static func makePolicyDate(from dates: [Date], now: Date = Date(), calendar: Calendar = .current) -> Date {
        if let last = dates.last, last > now { return last }
        return calendar.date(byAdding: .hour, value: 1, to: now) ?? now.addingTimeInterval(3600)
    }
}

enum LoveQuestWidgetDataReader {
    static let appGroupId = "group.com.wayne.lovequest"
    static let dataKey = "lovequest_widget_data"

    static func load() -> LoveQuestWidgetPayload {
        guard
            let defaults = UserDefaults(suiteName: appGroupId),
            let text = defaults.string(forKey: dataKey),
            let data = text.data(using: .utf8)
        else {
            return .empty
        }
        let decoder = JSONDecoder()
        if let payload = try? decoder.decode(LoveQuestWidgetPayload.self, from: data) {
            return payload
        }
        return .empty
    }
}
