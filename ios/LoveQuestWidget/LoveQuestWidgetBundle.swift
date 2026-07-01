import WidgetKit
import SwiftUI

@main
struct LoveQuestWidgetBundle: WidgetBundle {
    var body: some Widget {
        LoveQuestClassicWidget()
        LoveQuestPetWidget()
    }
}
