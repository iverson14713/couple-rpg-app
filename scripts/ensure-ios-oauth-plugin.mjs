/**
 * cap sync only scans node_modules plugins — local LoveQuest plugins must stay in packageClassList.
 * CapacitorBridge loads this list via NSClassFromString() from ios/App/App/capacitor.config.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const capJsonPath = resolve('ios/App/App/capacitor.config.json');
const pbxprojPath = resolve('ios/App/App.xcodeproj/project.pbxproj');

/** Must match @objc(...) in *.swift and CAP_PLUGIN(..., "jsName") in *.m */
const LOCAL_PLUGIN_CLASSES = [
  'LoveQuestOAuthPlugin',
  'LoveQuestAppleSignInPlugin',
  'LoveQuestIAPPlugin',
];

const LOCAL_SOURCE_MARKERS = [
  'LoveQuestOAuthPlugin.swift in Sources',
  'LoveQuestOAuthPlugin.m in Sources',
  'LoveQuestAppleSignInPlugin.swift in Sources',
  'LoveQuestAppleSignInPlugin.m in Sources',
  'LoveQuestIAPPlugin.swift in Sources',
  'LoveQuestIAPPlugin.m in Sources',
];

function ensurePbxprojSources() {
  const pbx = readFileSync(pbxprojPath, 'utf8');
  const missing = LOCAL_SOURCE_MARKERS.filter((marker) => !pbx.includes(marker));
  if (missing.length > 0) {
    console.error('[ensure-ios-plugins] App target Compile Sources missing:');
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
  }
  console.log('[ensure-ios-plugins] App target Compile Sources OK (6 local plugin files)');
}

function ensurePackageClassList() {
  const capJSON = JSON.parse(readFileSync(capJsonPath, 'utf8'));
  const list = Array.isArray(capJSON.packageClassList) ? [...capJSON.packageClassList] : [];
  let changed = false;

  for (const pluginClass of LOCAL_PLUGIN_CLASSES) {
    if (!list.includes(pluginClass)) {
      list.push(pluginClass);
      changed = true;
      console.log(`[ensure-ios-plugins] added ${pluginClass} to packageClassList`);
    }
  }

  if (changed) {
    capJSON.packageClassList = list;
    writeFileSync(capJsonPath, `${JSON.stringify(capJSON, null, '\t')}\n`);
  } else {
    console.log('[ensure-ios-plugins] packageClassList already includes local plugins');
  }

  const stillMissing = LOCAL_PLUGIN_CLASSES.filter((c) => !list.includes(c));
  if (stillMissing.length > 0) {
    console.error('[ensure-ios-plugins] packageClassList still missing:', stillMissing.join(', '));
    process.exit(1);
  }

  console.log('[ensure-ios-plugins] packageClassList:', list.join(', '));
}

ensurePbxprojSources();
ensurePackageClassList();
