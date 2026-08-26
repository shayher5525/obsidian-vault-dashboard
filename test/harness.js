// test/harness.js — 脱机验证数据层：stub 掉 obsidian，require 插件源码，跑真实日志文件。
// 用法：node test/harness.js   （从库根或插件目录运行均可；库根按相对路径解析）
const fs = require("fs");
const path = require("path");
const Module = require("module");

// 1) stub obsidian 模块
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "obsidian") {
    return {
      Plugin: class Plugin {},
      ItemView: class ItemView {},
      Notice: class Notice {},
      TFile: class TFile {},
      TFolder: class TFolder {},
      PluginSettingTab: class PluginSettingTab {},
      Setting: class Setting {},
      setTooltip: () => {},
    };
  }
  return origLoad.call(this, request, parent, isMain);
};

// 2) require 插件源码（清缓存，规避重复 require）
const pluginDir = path.resolve(__dirname, "..");
const VAULT_ROOT = path.resolve(pluginDir, "../../..");
const pluginPath = path.join(pluginDir, "main.js");
delete require.cache[require.resolve(pluginPath)];
const api = require(pluginPath)._internal;

// 3) changelog 基线校验
const LOG_PATH = "迭代日志.md";
const LOG_FOLDER = "A_CultureOps-Codex-Daily/12_Automation 自动化脚本/12-03_ChangeLog 迭代日志";

const counts = new Map();
const rootLog = path.join(VAULT_ROOT, LOG_PATH);
if (fs.existsSync(rootLog)) {
  api.mergeCounts(counts, api.parseIterationLog(fs.readFileSync(rootLog, "utf8")));
}
const folderLog = path.join(VAULT_ROOT, LOG_FOLDER);
if (fs.existsSync(folderLog)) {
  for (const name of fs.readdirSync(folderLog)) {
    if (name.endsWith(".md")) {
      api.mergeCounts(counts, api.parseIterationLog(fs.readFileSync(path.join(folderLog, name), "utf8")));
    }
  }
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
const days = counts.size;
const sorted = [...counts.keys()].sort();
const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

console.log("=== changelog 基线 ===");
console.log(`天数: ${days}  条目: ${total}`);
console.log(`范围: ${sorted[0]} → ${sorted[sorted.length - 1]}`);
if (busiest) console.log(`最忙: ${busiest[0]}（${busiest[1]} 条）`);

const expectedDays = 63;
const expectedTotal = 1020;
const ok = days === expectedDays && total === expectedTotal;
console.log(`期望 ${expectedDays} 天 / ${expectedTotal} 条 → ${ok ? "PASS" : "FAIL"}`);

// 4) 回退链单元测试
let pass = 0;
let fail = 0;
function assert(label, actual, expected) {
  if (actual === expected) {
    pass++;
    console.log(`  ok   ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}: 期望 ${expected}，实际 ${actual}`);
  }
}

console.log("\n=== noteActivityDay 回退链 ===");
const mkFile = (basename, mtime) => ({ basename, stat: { mtime } });
const def = { activityDateField: "updated", useMtime: false };

assert("frontmatter.updated 命中",
  api.noteActivityDay(mkFile("x.md", 0), { frontmatter: { updated: "2026-08-26T10:00:00+08:00" } }, def),
  "2026-08-26");
assert("主字段可配（customDate）",
  api.noteActivityDay(mkFile("x.md", 0), { frontmatter: { published: "2026-01-02" } }, { activityDateField: "published", useMtime: false }),
  "2026-01-02");
assert("回退 created",
  api.noteActivityDay(mkFile("x.md", 0), { frontmatter: { created: "2026-03-04" } }, def),
  "2026-03-04");
assert("回退 date",
  api.noteActivityDay(mkFile("x.md", 0), { frontmatter: { date: "2026-05-06" } }, def),
  "2026-05-06");
assert("回退文件名日期",
  api.noteActivityDay(mkFile("2026-07-08 会议纪要.md", 0), {}, def),
  "2026-07-08");
assert("mtime 关闭时不兜底",
  api.noteActivityDay(mkFile("随便.md", 1700000000000), {}, def),
  null);
assert("mtime 开启时兜底",
  api.noteActivityDay(mkFile("随便.md", new Date("2026-08-20T00:00:00").getTime()), {}, { activityDateField: "updated", useMtime: true }),
  "2026-08-20");

console.log("\n=== ymdFromValue ===");
assert("ISO 字符串", api.ymdFromValue("2026-08-26T10:00:00+08:00"), "2026-08-26");
assert("纯日期字符串", api.ymdFromValue("2026-08-26"), "2026-08-26");
assert("Date 对象", api.ymdFromValue(new Date(2026, 7, 26)), "2026-08-26");
assert("数字时间戳", api.ymdFromValue(new Date(2026, 7, 26).getTime()), "2026-08-26");
assert("null", api.ymdFromValue(null), null);

console.log(`\n单元测试: ${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 && ok ? 0 : 1);