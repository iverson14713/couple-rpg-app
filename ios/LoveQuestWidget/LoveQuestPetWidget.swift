import WidgetKit
import SwiftUI

// MARK: - Timeline

struct LoveQuestPetWidgetEntry: TimelineEntry {
    let date: Date
    let payload: LoveQuestWidgetPayload

    var materialized: LoveQuestWidgetMaterialized {
        payload.materialized(at: date)
    }
}

struct LoveQuestPetWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> LoveQuestPetWidgetEntry {
        let payload = LoveQuestWidgetPayload(
            coupleName: "Wayne・B",
            togetherTitle: "我們在一起",
            togetherDays: 1359,
            nextEventTitle: "在一起紀念日",
            nextEventDaysLeft: 103,
            nextEventDateLabel: "2026/10/10（六）",
            flameDays: 15,
            isPro: true,
            updatedAt: Date().timeIntervalSince1970 * 1000,
            hasData: true,
            hasInteractedToday: true,
            lastInteractionDate: LoveQuestWidgetDateMath.ymdString(from: Date()),
            relationshipStartDate: "2022-06-01",
            nextImportantAnnualYmd: "2020-10-10",
            nextImportantTitle: "在一起紀念日",
            todayInteractionDate: LoveQuestWidgetDateMath.ymdString(from: Date()),
            isLoggedIn: true,
            isCoupleBound: true
        )
        return LoveQuestPetWidgetEntry(date: Date(), payload: payload)
    }

    func getSnapshot(in context: Context, completion: @escaping (LoveQuestPetWidgetEntry) -> Void) {
        let now = Date()
        let payload = LoveQuestWidgetDataReader.load()
        completion(LoveQuestPetWidgetEntry(date: now, payload: payload))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LoveQuestPetWidgetEntry>) -> Void) {
        let payload = LoveQuestWidgetDataReader.load()
        let now = Date()
        let refreshDates = LoveQuestWidgetTimelineBuilder.refreshDates(from: now)
        let entries = refreshDates.map { date in
            LoveQuestPetWidgetEntry(date: date, payload: payload)
        }
        let policyDate = LoveQuestWidgetTimelineBuilder.makePolicyDate(from: refreshDates, now: now)
        completion(Timeline(entries: entries, policy: .after(policyDate)))
    }
}

// MARK: - Entry

struct LoveQuestPetWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    let entry: LoveQuestPetWidgetEntry

    private var theme: LoveQuestWidgetTheme { LoveQuestWidgetTheme() }
    private var deepLink: URL { URL(string: "https://lovequest.app/")! }

    var body: some View {
        ZStack {
            if #unavailable(iOS 17.0) {
                WidgetSceneBackground(theme: theme)
            }
            HeroGlowDecoration()

            if family == .systemMedium {
                PetMediumLoveQuestWidgetView(entry: entry, theme: theme)
            } else {
                PetSmallLoveQuestWidgetView(entry: entry, theme: theme)
            }
        }
        .widgetURL(deepLink)
    }
}

// MARK: - Xiaoi image

/// Pet widget 使用裁切透明邊後的專用圖（`xiaoi_widget_*`），首頁 Hero 仍用原始 `xiaoi_*`。
private func petWidgetImageName(_ imageName: String) -> String {
    switch imageName {
    case "xiaoi_happy": return "xiaoi_widget_happy"
    case "xiaoi_sad": return "xiaoi_widget_sad"
    case "xiaoi_sleepy": return "xiaoi_widget_sleepy"
    case "xiaoi_back_angry": return "xiaoi_widget_back_angry"
    default: return imageName
    }
}

private func petWidgetSmallStatusLine(_ xiaoi: XiaoiResolvedState) -> String {
    switch xiaoi.state {
    case .happy: return "今天好幸福 💕"
    case .sad: return "我在等你們說說話…"
    case .sleepy: return "晚安，明天也要好好愛對方"
    case .back_angry: return "快把愛哄回來"
    }
}

private func petWidgetMediumStatusLine(_ xiaoi: XiaoiResolvedState) -> String {
    switch xiaoi.state {
    case .happy: return "今天好幸福 💕"
    case .sad: return "我在等你們說說話…"
    case .sleepy: return "晚安，明天也要好好愛對方"
    case .back_angry: return "快把我們的愛哄回來"
    }
}

private struct PetWidgetNextEventBlock: View {
    let materialized: LoveQuestWidgetMaterialized
    let theme: LoveQuestWidgetTheme

    var body: some View {
        if let title = materialized.nextEventTitle, let daysLeft = materialized.nextEventDaysLeft {
            VStack(alignment: .leading, spacing: 2) {
                Text("🎂 \(title)")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(theme.primaryText.opacity(0.92))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)

                Text("剩 \(formatDays(daysLeft)) 天")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.mutedText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
        } else {
            Text("📅 還沒設定重要日子")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(theme.mutedText)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
    }
}

private struct PetMediumRightInfoPanel: View {
    let materialized: LoveQuestWidgetMaterialized
    let theme: LoveQuestWidgetTheme

    private var payload: LoveQuestWidgetPayload { materialized.payload }

    private var coupleFooter: String? {
        let name = payload.coupleName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty, name != "LoveQuest", name != "我・另一半" else { return nil }
        return "💕 \(name)"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("🔥 火苗 \(max(0, payload.flameDays)) 天")
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(theme.secondaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.8)

            if materialized.togetherDays > 0 {
                Text("💕 在一起 \(formatDays(materialized.togetherDays)) 天")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(theme.primaryText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }

            PetWidgetNextEventBlock(materialized: materialized, theme: theme)
                .padding(.top, 1)

            Spacer(minLength: 0)

            if let coupleFooter {
                Text(coupleFooter)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.mutedText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
        }
    }
}

struct XiaoiWidgetImage: View {
    let imageName: String

    var body: some View {
        Image(imageName)
            .resizable()
            .interpolation(.high)
            .scaledToFit()
    }
}

// MARK: - Small

private struct PetSmallLoveQuestWidgetView: View {
    let entry: LoveQuestPetWidgetEntry
    let theme: LoveQuestWidgetTheme

    private var materialized: LoveQuestWidgetMaterialized { entry.materialized }
    private var xiaoi: XiaoiResolvedState { materialized.xiaoi }
    private var payload: LoveQuestWidgetPayload { entry.payload }
    private var flameDays: Int { max(0, payload.flameDays) }

    var body: some View {
        GeometryReader { geo in
            VStack(spacing: 2) {
                Spacer(minLength: 0)

                XiaoiWidgetImage(imageName: petWidgetImageName(xiaoi.imageName))
                    .frame(
                        maxWidth: geo.size.width * 1.05,
                        maxHeight: geo.size.height * 0.61
                    )
                    .layoutPriority(1)

                VStack(spacing: 1) {
                    Text("🔥 火苗 \(flameDays) 天")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(theme.primaryText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)

                    if materialized.togetherDays > 0 {
                        Text("💕 在一起 \(formatDays(materialized.togetherDays)) 天")
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                            .foregroundStyle(theme.secondaryText)
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                    }

                    Text(petWidgetSmallStatusLine(xiaoi))
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(theme.footerText)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .minimumScaleFactor(0.85)
                        .padding(.top, 1)
                }

                Spacer(minLength: 0)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
    }
}

// MARK: - Medium

private struct PetMediumLoveQuestWidgetView: View {
    let entry: LoveQuestPetWidgetEntry
    let theme: LoveQuestWidgetTheme

    private var materialized: LoveQuestWidgetMaterialized { entry.materialized }
    private var xiaoi: XiaoiResolvedState { materialized.xiaoi }
    private var payload: LoveQuestWidgetPayload { entry.payload }

    private let leftColumnRatio: CGFloat = 0.47

    var body: some View {
        GeometryReader { geo in
            let leftWidth = geo.size.width * leftColumnRatio

            HStack(alignment: .center, spacing: 6) {
                VStack(spacing: 4) {
                    XiaoiWidgetImage(imageName: petWidgetImageName(xiaoi.imageName))
                        .frame(
                            width: leftWidth * 1.04,
                            height: geo.size.height * 0.66
                        )

                    Text(petWidgetMediumStatusLine(xiaoi))
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                        .foregroundStyle(theme.footerText)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .minimumScaleFactor(0.8)
                        .frame(maxWidth: leftWidth)
                }
                .frame(width: leftWidth)

                VStack(alignment: .leading, spacing: 4) {
                    PetMediumRightInfoPanel(materialized: materialized, theme: theme)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .padding(.trailing, 2)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 5)
    }
}

// MARK: - Widget

struct LoveQuestPetWidget: Widget {
    let kind: String = "LoveQuestPetWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LoveQuestPetWidgetProvider()) { entry in
            if #available(iOS 17.0, *) {
                LoveQuestPetWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        WidgetAdaptiveBackground()
                    }
            } else {
                LoveQuestPetWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("LoveQuest 小愛")
        .description("把你們的小愛放在桌面上，有互動會開心，太久沒互動會委屈")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
