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

// 实库数据随本人每天写日志而增长，不能作断言依据，仅打印供参看。
console.log("（实库为活数据，仅供参看，不参与成败判定）");

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

// 固定夹具：内容不变，可做精确断言
console.log("\n=== changelog 解析（固定夹具） ===");
const fixture = path.join(__dirname, "fixtures", "changelog-sample.md");
const fx = api.parseIterationLog(fs.readFileSync(fixture, "utf8"));
const fxTotal = [...fx.values()].reduce((a, b) => a + b, 0);
assert("夹具天数", fx.size, 3);
assert("夹具条目数", fxTotal, 5);
assert("多分类同日合并", fx.get("2026-01-03"), 3);
assert("引用行不计数", fx.get("2026-01-02"), 1);
assert("非日期二级标题结束当天", fx.get("2026-01-01"), 1);

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

// 5) Starbucks 外观只能使用规范内的八个基础色，透明色亦须由其 RGB 派生。
console.log("\n=== Starbucks 标准色域 ===");
const css = fs.readFileSync(path.join(pluginDir, "styles.css"), "utf8");
const starbucksBlocks = [...css.matchAll(/[^{}]*\.vdash-style-starbucks[^{}]*\{([^{}]*)\}/g)]
  .map((match) => match[1])
  .join("\n");
const allowedHex = new Set([
  "#006241", "#00754a", "#d4e9e2", "#1e3932",
  "#000000", "#f2f0eb", "#f9f9f9", "#ffffff",
]);
const allowedRgb = new Set([
  "0,98,65", "0,117,74", "212,233,226", "30,57,50",
  "0,0,0", "242,240,235", "249,249,249", "255,255,255",
]);
const usedHex = [...starbucksBlocks.matchAll(/#[0-9a-f]{6}\b/gi)]
  .map((match) => match[0].toLowerCase());
const usedRgb = [...starbucksBlocks.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)]
  .map((match) => `${match[1]},${match[2]},${match[3]}`);
const disallowedHex = [...new Set(usedHex.filter((value) => !allowedHex.has(value)))];
const disallowedRgb = [...new Set(usedRgb.filter((value) => !allowedRgb.has(value)))];

assert("八个标准 HEX 均已声明", [...allowedHex].every((value) => usedHex.includes(value)), true);
assert("无规范外 HEX", disallowedHex.join(", ") || null, null);
assert("透明色只由标准色派生", disallowedRgb.join(", ") || null, null);

const source = fs.readFileSync(path.join(pluginDir, "main.js"), "utf8");
assert("热力格含无障碍名称", source.includes('cell.setAttr("aria-label", label)'), true);
assert("可点击热力格支持键盘", source.includes('event.key !== "Enter" && event.key !== " "'), true);

console.log(`\n单元测试: ${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
