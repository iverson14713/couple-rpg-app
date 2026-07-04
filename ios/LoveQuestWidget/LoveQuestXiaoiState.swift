import Foundation

enum XiaoiState: String {
    case happy
    case sad
    case sleepy
    case back_angry

    var widgetMessage: String {
        switch self {
        case .happy:
            return "今天好幸福 💕"
        case .sad:
            return "今天還沒互動 🥺"
        case .sleepy:
            return "明天也要愛對方"
        case .back_angry:
            return "快把愛哄回來"
        }
    }
}

struct XiaoiResolvedState {
    let state: XiaoiState
    let imageName: String
    let title: String
    let message: String
}

enum LoveQuestXiaoiState {
    static func resolve(payload: LoveQuestWidgetPayload, at date: Date = Date()) -> XiaoiResolvedState {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: date)
        let flame = max(0, payload.flameDays)
        let daysSince = daysSinceLastInteraction(payload.lastInteractionDate, today: date, calendar: calendar)
        let interactedToday = LoveQuestWidgetDateMath.hasInteractedToday(payload: payload, at: date)

        if payload.isLoggedIn == false {
            return backAngry(message: "快把愛哄回來")
        }

        if payload.isCoupleBound == false {
            return backAngry(message: "快把愛哄回來")
        }

        if flame <= 0 || daysSince > 1 {
            return backAngry(message: XiaoiState.back_angry.widgetMessage)
        }

        if interactedToday {
            return XiaoiResolvedState(
                state: .happy,
                imageName: "xiaoi_happy",
                title: "今天好幸福",
                message: XiaoiState.happy.widgetMessage
            )
        }

        if isNightHour(hour) {
            return XiaoiResolvedState(
                state: .sleepy,
                imageName: "xiaoi_sleepy",
                title: "小愛睡著了",
                message: XiaoiState.sleepy.widgetMessage
            )
        }

        return XiaoiResolvedState(
            state: .sad,
            imageName: "xiaoi_sad",
            title: "小愛在等你",
            message: XiaoiState.sad.widgetMessage
        )
    }

    static func resolve(
        hasInteractedToday: Bool,
        flameDays: Int,
        lastInteractionDate: String?,
        at date: Date = Date()
    ) -> XiaoiResolvedState {
        var payload = LoveQuestWidgetPayload.empty
        payload.flameDays = flameDays
        payload.lastInteractionDate = lastInteractionDate
        payload.hasInteractedToday = hasInteractedToday
        payload.isLoggedIn = true
        payload.isCoupleBound = true
        if hasInteractedToday {
            payload.todayInteractionDate = LoveQuestWidgetDateMath.ymdString(from: date)
        }
        return resolve(payload: payload, at: date)
    }

    private static func backAngry(message: String) -> XiaoiResolvedState {
        XiaoiResolvedState(
            state: .back_angry,
            imageName: "xiaoi_back_angry",
            title: "小愛鬧脾氣了",
            message: message
        )
    }

    private static func isNightHour(_ hour: Int) -> Bool {
        hour >= 22 || hour < 7
    }

    private static func daysSinceLastInteraction(
        _ lastInteractionDate: String?,
        today: Date,
        calendar: Calendar
    ) -> Int {
        guard let lastInteractionDate, !lastInteractionDate.isEmpty else { return 999 }
        guard
            let last = LoveQuestWidgetDateMath.parseYmd(lastInteractionDate),
            let todayStart = calendar.date(from: calendar.dateComponents([.year, .month, .day], from: today))
        else {
            return 999
        }
        let lastStart = calendar.date(from: calendar.dateComponents([.year, .month, .day], from: last)) ?? last
        let diff = calendar.dateComponents([.day], from: lastStart, to: todayStart).day ?? 999
        return diff
    }
}
