import WidgetKit
import SwiftUI

// MARK: - Timeline

struct LoveQuestWidgetEntry: TimelineEntry {
    let date: Date
    let payload: LoveQuestWidgetPayload
}

struct LoveQuestWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> LoveQuestWidgetEntry {
        LoveQuestWidgetEntry(
            date: Date(),
            payload: LoveQuestWidgetPayload(
                coupleName: "Wayne・B",
                togetherTitle: "我們在一起",
                togetherDays: 1358,
                nextEventTitle: "在一起紀念日",
                nextEventDaysLeft: 104,
                nextEventDateLabel: "2026/10/10（六）",
                flameDays: 15,
                isPro: true,
                updatedAt: Date().timeIntervalSince1970 * 1000,
                hasData: true
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (LoveQuestWidgetEntry) -> Void) {
        completion(LoveQuestWidgetEntry(date: Date(), payload: LoveQuestWidgetDataReader.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LoveQuestWidgetEntry>) -> Void) {
        let payload = LoveQuestWidgetDataReader.load()
        let now = Date()
        let refreshDates = LoveQuestWidgetTimelineBuilder.refreshDates(from: now)
        let entries = refreshDates.map { date in
            LoveQuestWidgetEntry(date: date, payload: payload)
        }
        let policyDate = LoveQuestWidgetTimelineBuilder.makePolicyDate(from: refreshDates, now: now)
        completion(Timeline(entries: entries, policy: .after(policyDate)))
    }
}

// MARK: - Entry

struct LoveQuestWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family

    let entry: LoveQuestWidgetEntry

    private var payload: LoveQuestWidgetPayload { entry.payload }
    private var theme: LoveQuestWidgetTheme { LoveQuestWidgetTheme() }
    private var deepLink: URL { URL(string: "https://lovequest.app/")! }

    var body: some View {
        ZStack {
            if #unavailable(iOS 17.0) {
                WidgetSceneBackground(theme: theme)
            }
            HeroGlowDecoration()

            Group {
                if !entry.payload.hasData {
                    EmptyLoveQuestWidgetView(isMedium: family == .systemMedium, theme: theme)
                } else if family == .systemMedium {
                    MediumLoveQuestWidgetView(
                        materialized: entry.payload.materialized(at: entry.date),
                        theme: theme
                    )
                } else {
                    SmallLoveQuestWidgetView(
                        materialized: entry.payload.materialized(at: entry.date),
                        theme: theme
                    )
                }
            }
        }
        .widgetURL(deepLink)
    }
}

// MARK: - Theme

private enum LQColor {
    static let heroTop = Color(red: 1.0, green: 0.49, blue: 0.72)      // #FF7DB8
    static let heroMid = Color(red: 1.0, green: 0.36, blue: 0.60)      // #FF5C9A
    static let heroBottom = Color(red: 0.97, green: 0.65, blue: 1.0)   // #F7A7FF
}

struct LoveQuestWidgetTheme {
    var backgroundGradient: LinearGradient {
        LinearGradient(
            colors: [LQColor.heroTop, LQColor.heroMid, LQColor.heroBottom],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var primaryText: Color { .white }
    var secondaryText: Color { .white.opacity(0.85) }
    var mutedText: Color { .white.opacity(0.82) }
    var numberText: Color { .white }
    var footerText: Color { .white.opacity(0.9) }
    var divider: Color { .white.opacity(0.22) }
}

// MARK: - Shared components

struct WidgetSceneBackground: View {
    let theme: LoveQuestWidgetTheme

    var body: some View {
        theme.backgroundGradient
    }
}

struct HeroGlowDecoration: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(Color.white.opacity(0.14))
                .frame(width: 72, height: 72)
                .blur(radius: 18)
                .offset(x: 52, y: -28)
            Circle()
                .fill(Color.white.opacity(0.10))
                .frame(width: 56, height: 56)
                .blur(radius: 14)
                .offset(x: -48, y: 36)
        }
        .allowsHitTesting(false)
    }
}

func formatDays(_ value: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.groupingSeparator = ","
    return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
}

private struct DaysCountView: View {
    let days: Int
    let numberSize: CGFloat
    let unitSize: CGFloat
    let theme: LoveQuestWidgetTheme

    var body: some View {
        HStack(alignment: .lastTextBaseline, spacing: 3) {
            Text(formatDays(days))
                .font(.system(size: numberSize, weight: .bold, design: .rounded))
                .foregroundStyle(theme.numberText)
                .minimumScaleFactor(0.75)
                .lineLimit(1)
            Text("天")
                .font(.system(size: unitSize, weight: .semibold, design: .rounded))
                .foregroundStyle(theme.numberText.opacity(0.92))
                .lineLimit(1)
        }
        .fixedSize(horizontal: false, vertical: true)
    }
}

private struct CountdownDaysView: View {
    let daysLeft: Int
    let numberSize: CGFloat
    let unitSize: CGFloat
    let theme: LoveQuestWidgetTheme

    var body: some View {
        HStack(alignment: .lastTextBaseline, spacing: 2) {
            Text("剩")
                .font(.system(size: unitSize, weight: .semibold, design: .rounded))
                .foregroundStyle(theme.secondaryText)
            Text(formatDays(daysLeft))
                .font(.system(size: numberSize, weight: .bold, design: .rounded))
                .foregroundStyle(theme.numberText)
                .minimumScaleFactor(0.75)
                .lineLimit(1)
            Text("天")
                .font(.system(size: unitSize, weight: .semibold, design: .rounded))
                .foregroundStyle(theme.numberText.opacity(0.92))
        }
        .fixedSize(horizontal: false, vertical: true)
    }
}

private struct FlameBadge: View {
    let days: Int
    let theme: LoveQuestWidgetTheme
    var fontSize: CGFloat = 12

    var body: some View {
        if days > 0 {
            Text("🔥 火苗 \(days) 天")
                .font(.system(size: fontSize, weight: .medium, design: .rounded))
                .foregroundStyle(theme.mutedText)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
    }
}

private struct SubtleVerticalDivider: View {
    let theme: LoveQuestWidgetTheme

    var body: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(theme.divider)
                .frame(width: 1)
            Text("💕")
                .font(.system(size: 10))
                .padding(.vertical, 2)
            Rectangle()
                .fill(theme.divider)
                .frame(width: 1)
        }
        .frame(maxHeight: .infinity)
    }
}

// MARK: - Small

struct SmallLoveQuestWidgetView: View {
    let materialized: LoveQuestWidgetMaterialized
    let theme: LoveQuestWidgetTheme

    private var payload: LoveQuestWidgetPayload { materialized.payload }

    var body: some View {
        VStack(spacing: 4) {
            Text("💕")
                .font(.system(size: 26))

            Text(payload.coupleName)
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(theme.primaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.8)

            Text(payload.togetherTitle)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(theme.secondaryText)
                .lineLimit(1)

            DaysCountView(
                days: materialized.togetherDays,
                numberSize: 40,
                unitSize: 15,
                theme: theme
            )
            .padding(.top, 2)

            Spacer(minLength: 0)

            FlameBadge(days: payload.flameDays, theme: theme, fontSize: 13)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
    }
}

// MARK: - Medium

struct MediumLoveQuestWidgetView: View {
    let materialized: LoveQuestWidgetMaterialized
    let theme: LoveQuestWidgetTheme

    private var payload: LoveQuestWidgetPayload { materialized.payload }

    var body: some View {
        VStack(spacing: 6) {
            HStack(alignment: .top, spacing: 0) {
                leftPanel
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

                SubtleVerticalDivider(theme: theme)
                    .padding(.horizontal, 6)

                rightPanel
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }

            Text("✨ 今天也要記得互動一下，讓愛持續升溫 💕")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(theme.footerText)
                .lineLimit(2)
                .minimumScaleFactor(0.85)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
    }

    private var leftPanel: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("💕 \(payload.coupleName)")
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(theme.primaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.8)

            Text(payload.togetherTitle)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(theme.secondaryText)
                .lineLimit(1)

            DaysCountView(
                days: materialized.togetherDays,
                numberSize: 38,
                unitSize: 15,
                theme: theme
            )
            .padding(.top, 2)

            Spacer(minLength: 0)

            FlameBadge(days: payload.flameDays, theme: theme, fontSize: 12)
        }
    }

    @ViewBuilder
    private var rightPanel: some View {
        if let title = materialized.nextEventTitle, let daysLeft = materialized.nextEventDaysLeft {
            VStack(alignment: .leading, spacing: 4) {
                Text("🎂 下一個重要日子")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(theme.secondaryText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)

                Text(title)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(theme.primaryText)
                    .lineLimit(2)
                    .minimumScaleFactor(0.85)

                CountdownDaysView(
                    daysLeft: daysLeft,
                    numberSize: 32,
                    unitSize: 14,
                    theme: theme
                )
                .padding(.top, 2)

                if let dateLabel = payload.nextEventDateLabel, !dateLabel.isEmpty {
                    Text("📅 \(dateLabel)")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(theme.mutedText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .padding(.top, 2)
                }

                Spacer(minLength: 0)
            }
        } else {
            VStack(alignment: .leading, spacing: 4) {
                Text("🎂 下一個重要日子")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(theme.secondaryText)
                Text("尚未設定")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.primaryText)
                Spacer(minLength: 0)
            }
        }
    }
}

// MARK: - Empty

struct EmptyLoveQuestWidgetView: View {
    let isMedium: Bool
    let theme: LoveQuestWidgetTheme

    var body: some View {
        if isMedium {
            VStack(alignment: .leading, spacing: 6) {
                Text("💕 LoveQuest")
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundStyle(theme.primaryText)
                Text("還沒有設定紀念日")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(theme.secondaryText)
                Text("打開 App 設定你們的第一個重要日子")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.mutedText)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(10)
        } else {
            VStack(spacing: 6) {
                Text("💕")
                    .font(.system(size: 28))
                Text("LoveQuest")
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundStyle(theme.primaryText)
                Text("把重要日子放到桌面")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.secondaryText)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(10)
        }
    }
}

// MARK: - Widget definition

struct WidgetAdaptiveBackground: View {
    var body: some View {
        LoveQuestWidgetTheme().backgroundGradient
    }
}

struct LoveQuestClassicWidget: Widget {
    let kind: String = "LoveQuestWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LoveQuestWidgetProvider()) { entry in
            if #available(iOS 17.0, *) {
                LoveQuestWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        WidgetAdaptiveBackground()
                    }
            } else {
                LoveQuestWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("LoveQuest 情侶日常")
        .description("查看交往天數、紀念日倒數與火苗")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
