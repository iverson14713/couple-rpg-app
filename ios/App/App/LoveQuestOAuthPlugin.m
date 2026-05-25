#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LoveQuestOAuthPlugin, "LoveQuestOAuth",
    CAP_PLUGIN_METHOD(authenticate, CAPPluginReturnPromise);
)
