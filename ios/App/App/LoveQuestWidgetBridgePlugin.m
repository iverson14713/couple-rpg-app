#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LoveQuestWidgetBridgePlugin, "LoveQuestWidgetBridge",
    CAP_PLUGIN_METHOD(saveWidgetData, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(reloadWidget, CAPPluginReturnPromise);
)
