/**
 * `cap sync ios` only scans node_modules plugins and overwrites packageClassList.
 * LoveQuest local plugins (OAuth / Apple Sign-In / IAP) live in ios/App/App — merge them back in.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const appDir = resolve('ios/App/App');
const capJsonPath = join(appDir, 'capacitor.config.json');
const pbxprojPath = resolve('ios/App/App.xcodeproj/project.pbxproj');

const LOCAL_SOURCE_MARKERS = [
  'LoveQuestOAuthPlugin.swift in Sources',
  'LoveQuestOAuthPlugin.m in Sources',
  'LoveQuestAppleSignInPlugin.swift in Sources',
  'LoveQuestAppleSignInPlugin.m in Sources',
  'LoveQuestIAPPlugin.swift in Sources',
  'LoveQuestIAPPlugin.m in Sources',
  'MainBridgeViewController.swift in Sources',
  'LoveQuestWidgetBridgePlugin.swift in Sources',
  'LoveQuestWidgetBridgePlugin.m in Sources',
  'LoveQuestWidgetStore.swift in Sources',
];

function discoverLocalPluginClasses() {
  const classList = [];
  const swiftRegex = /@objc\(([A-Za-z0-9_-]+)\)/;
  const objcRegex = /CAP_PLUGIN\(([A-Za-z0-9_-]+)/;

  for (const name of readdirSync(appDir)) {
    if (!name.endsWith('.swift') && !name.endsWith('.m')) continue;
    const fileData = readFileSync(join(appDir, name), 'utf8');
    const swiftMatch = swiftRegex.exec(fileData);
    if (swiftMatch?.[1] && swiftMatch[1].endsWith('Plugin') && !classList.includes(swiftMatch[1])) {
      classList.push(swiftMatch[1]);
    }
    const objcMatch = objcRegex.exec(fileData);
    if (objcMatch?.[1] && !classList.includes(objcMatch[1])) {
      classList.push(objcMatch[1]);
    }
  }

  return [...new Set(classList)].sort();
}

function ensurePbxprojSources() {
  const pbx = readFileSync(pbxprojPath, 'utf8');
  const missing = LOCAL_SOURCE_MARKERS.filter((marker) => !pbx.includes(marker));
  if (missing.length > 0) {
    console.error('[ensure-ios-plugins] App target Compile Sources missing:');
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
  }
  console.log('[ensure-ios-plugins] App target Compile Sources OK (local plugins + MainBridgeViewController)');
}

function ensurePackageClassList() {
  const localClasses = discoverLocalPluginClasses();
  if (localClasses.length === 0) {
    console.error('[ensure-ios-plugins] no local plugin classes found in ios/App/App');
    process.exit(1);
  }

  const capJSON = JSON.parse(readFileSync(capJsonPath, 'utf8'));
  const list = Array.isArray(capJSON.packageClassList) ? [...capJSON.packageClassList] : [];
  let changed = false;

  for (const pluginClass of localClasses) {
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

  const stillMissing = localClasses.filter((c) => !list.includes(c));
  if (stillMissing.length > 0) {
    console.error('[ensure-ios-plugins] packageClassList still missing:', stillMissing.join(', '));
    process.exit(1);
  }

  console.log('[ensure-ios-plugins] local plugins:', localClasses.join(', '));
  console.log('[ensure-ios-plugins] packageClassList:', list.join(', '));
}

ensurePbxprojSources();
ensurePackageClassList();

const pbx = readFileSync(pbxprojPath, 'utf8');
if (!pbx.includes('LoveQuestWidgetExtension')) {
  console.error('[ensure-ios-plugins] LoveQuestWidgetExtension target missing from project.pbxproj');
  process.exit(1);
}
console.log('[ensure-ios-plugins] LoveQuestWidgetExtension target OK');
