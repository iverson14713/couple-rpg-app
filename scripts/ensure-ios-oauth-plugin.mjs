/**
 * cap sync only registers node_modules plugins — keep local LoveQuestOAuthPlugin in packageClassList.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const capJsonPath = resolve('ios/App/App/capacitor.config.json');
const capJSON = JSON.parse(readFileSync(capJsonPath, 'utf8'));
const list = Array.isArray(capJSON.packageClassList) ? [...capJSON.packageClassList] : [];
const pluginClass = 'LoveQuestOAuthPlugin';

if (!list.includes(pluginClass)) {
  list.push(pluginClass);
  capJSON.packageClassList = list;
  writeFileSync(capJsonPath, `${JSON.stringify(capJSON, null, '\t')}\n`);
  console.log(`[ensure-ios-oauth-plugin] added ${pluginClass} to packageClassList`);
}
