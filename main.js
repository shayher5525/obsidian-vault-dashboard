/*
 * 知识库仪表盘 · 活跃度总览
 *
 * 数据源抽象：provider 接口 `getDailyCounts(app, notes) → Map<'YYYY-MM-DD', number>`。
 *   默认「笔记活跃度」（每篇笔记按 frontmatter 日期 → 文件名日期 → mtime 逐级取活跃日）；
 *   「迭代日志」解析（`## YYYY-MM-DD` 小节 + 顶层列表项）保留为可选模式，本库继续用。
 *
 * 无构建步骤：本文件即插件产物，改完在 Obsidian 里禁用/启用插件即可生效。
 */

const {
  Plugin,
  ItemView,
  Notice,
  TFile,
  TFolder,
  PluginSettingTab,
  Setting,
  setTooltip,
} = require("obsidian");

const VIEW_TYPE = "vault-dashboard-x-view";
/**
 * 迭代日志数据源：可以是单个文件，也可以是装着月度日志的文件夹。
 * 2026-08-25 起日志按月拆分，库根 `迭代日志.md` 只剩总纲，日期小节全在月度目录里。
 * 仅作为 changelog 模式的默认路径；笔记活跃度模式不看这两个常量。
 */
/**
 * 迭代日志模式的默认路径：留空。
 * 该模式面向「库里维护着 changelog 文件」的用户，路径因库而异，不预设。
 */
const DEFAULT_CHANGELOG_PATHS = [];

/**
 * 统计排除的路径前缀，默认空 —— 通用库不预设任何排除项。
 * 用户可在设置里逐行填写（例如某个归档区或废纸篓目录）。
 */
const DEFAULT_EXCLUDED_PREFIXES = [];

function isExcluded(path, prefixes) {
  if (!prefixes || !prefixes.length) return false;
  return prefixes.some((prefix) => path.startsWith(prefix));
}

/** 周网格最少渲染周数，数据不足时向前补空周 */
const MIN_WEEKS = 20;
/** 周网格最多渲染周数：「全部」区间跨度过大（如笔记活跃度含离群日期）时封顶，避免渲染上万格子 */
const MAX_WEEKS = 53;
/** 库根散落笔记在目录树里的内部键（非显示文本，显示走 I18N.rootLabel） */
const ROOT_KEY = "__vault_root__";

const APPEARANCE_IDS = ["modern", "y2k", "starbucks"];

/** 可视文件夹板块 1 的出厂默认：留空，由用户在设置里选择文件夹 */
const FACTORY_ROOT_DEFAULT = "";
/** 内容工厂最多可配置的板块（标签）数，对应设置页的 5 组文件夹+名称 */
const FACTORY_SLOT_COUNT = 5;
/** 汇总视图（未选定子目录时）「近期修改」列表条数上限 */
const FACTORY_RECENT_LIMIT = 20;
/** 界面语言：同时影响设置页与仪表盘正文 */
const LOCALES = ["en", "zh-Hans", "zh-Hant", "fr", "it", "ja", "ko", "es"];
const DEFAULT_LOCALE = "en";
/** 内部 locale id → Intl 用 locale（数字 / 月份格式化） */
const INTL_LOCALE = {
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  en: "en",
  fr: "fr",
  it: "it",
  ja: "ja",
  ko: "ko",
  es: "es",
};

/** 语言名一律用该语言自己的写法，免去 8×8 的互译矩阵 */
const LOCALE_NAMES = {
  en: "English",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  fr: "Français",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
};

function formatNumber(n, localeId) {
  return n.toLocaleString(INTL_LOCALE[localeId] || "en");
}

function monthShort(date, localeId) {
  return new Intl.DateTimeFormat(INTL_LOCALE[localeId] || "en", { month: "short" }).format(date);
}

/** 数据源取值：笔记活跃度（通用默认）/ 迭代日志（本库原行为） */
const DATA_SOURCES = ["noteActivity", "changelog"];

const DEFAULT_SETTINGS = {
  appearance: "modern",
  locale: DEFAULT_LOCALE,
  /** 活跃度数据来源：noteActivity（笔记活跃度，通用默认）| changelog（迭代日志） */
  dataSource: "noteActivity",
  /** 笔记活跃度：优先取的 frontmatter 字段（取不到再回退 created/date → 文件名 → mtime） */
  activityDateField: "updated",
  /** 笔记活跃度：是否允许用 mtime 兜底。同步盘会批量刷新 mtime，默认关闭避免假柱。 */
  useMtime: false,
  /** 迭代日志模式：一条为文件、一条为文件夹（取其下所有 .md，不递归） */
  changelogPaths: DEFAULT_CHANGELOG_PATHS.slice(),
  /** 统计时排除的路径前缀，逐行配置；默认空 */
  excludedPrefixes: DEFAULT_EXCLUDED_PREFIXES.slice(),
  /**
   * 可视文件夹最多 5 个自定义板块（标签）：每项 { folder, label }。
   * folder 留空 = 该板块不显示；label 留空则用文件夹名自动去编号前缀。
   * 板块 1 默认指向原「内容工厂」根目录，升级用户视觉不变；2—5 默认留空。
   */
  factoryTabs: [
    { folder: FACTORY_ROOT_DEFAULT, label: "" },
    { folder: "", label: "" },
    { folder: "", label: "" },
    { folder: "", label: "" },
    { folder: "", label: "" },
  ],
};

/**
 * 三语界面文案：覆盖设置页与仪表盘正文。当前语言由 settings.locale 决定，默认英文。
 */
const I18N = {
  "zh-Hans": {
    settingsTitle: "知识库仪表盘设置",
    language: "语言",
    languageDesc: "设置页与仪表盘正文的界面语言。",
    localeName: LOCALE_NAMES,
    appearance: "外观风格",
    appearanceDesc: "选择仪表盘的视觉风格。更改后会立即应用到已打开的仪表盘。",
    dataSourceTitle: "数据源",
    dataSourceName: "活跃度数据来源",
    dataSourceDesc:
      "决定热力图按什么统计。「笔记活跃度」在任意库都能用；「迭代日志」按 changelog 文件解析（本库原有行为）。",
    dataSourceNoteActivity: "笔记活跃度",
    dataSourceChangelog: "迭代日志",
    activityDateFieldName: "活跃日期字段",
    activityDateFieldDesc:
      "优先取笔记 frontmatter 的这个字段作为活跃日期；取不到再依次回退 created / date → 文件名日期 → 文件修改时间。",
    useMtimeName: "用文件修改时间兜底",
    useMtimeDesc:
      "关闭时不用 mtime，避免同步盘（iCloud 等）批量刷新 mtime 造成「某天改几千篇」的假柱。默认关闭。",
    excludedPrefixesName: "排除路径",
    excludedPrefixesDesc: "每行一个路径前缀，匹配到的笔记不计入任何统计；留空表示不排除。",
    changelogPathsName: "迭代日志路径",
    changelogPathsDesc: "每行一个文件或文件夹路径；文件夹取其下所有 .md（不递归）。",
    factoryTitle: "快捷入口",
    factoryDesc:
      "最多可配置 5 个板块。每个板块指定一个文件夹，仪表盘按该文件夹的子目录出二级标签、按修改时间列出笔记。" +
      "「文件夹路径」留空则该板块不显示；填写后若「显示名称」留空，自动取文件夹名并去掉编号前缀。" +
      "配置 2 个及以上板块时，仪表盘上会出现一级标签供切换。",
    slotName: (i) => `板块 ${i}`,
    folderPlaceholder: "文件夹路径，如 B_ContentFactory 内容工厂",
    labelPlaceholder: "显示名称（留空用文件夹名）",
    statusFound: "✓ 已找到该文件夹",
    statusNotFound: "⚠ 库内未找到该路径，请检查大小写与完整层级",

    appearanceNames: { modern: "Apple", y2k: "Y2K 控制台", starbucks: "Starbucks 咖啡馆" },
    dashboardTitle: "知识库仪表盘",
    tabOverview: "总览",
    tabFolders: "目录",
    tabAll: "全部",
    rangeAll: "全部",
    range30d: "30天",
    range7d: "7天",
    rootLabel: "（库根）",
    selfFiles: "（本层文件）",
    unitNote: "笔记",
    unitIteration: "迭代",
    statNoteCount: "笔记总数",
    statActiveDays: "活跃天数",
    statStreakLabel: "当前连续",
    streakDays: (n) => `${n}天`,
    statTopBlocks: "顶层区块",
    statMaxDepth: (n) => `${n}层`,
    statRootScattered: "库根散落",
    statMaxDepthLabel: "最深层级",
    foldersEmpty: "库内暂无笔记。",
    addedInDays: (n) => `${n}天新增`,
    addedThisMonth: "本月新增",
    legendLess: "少",
    legendMore: "多",
    heatmapTooltipCount: (key, count, unit) => `${key} · ${count} 条${unit}`,
    heatmapTooltipEmpty: (key) => `${key} · 无记录`,
    footerEmpty: (unit) => `该区间还没有${unit}记录。`,
    footerSummary: (total, unit, average, busiestDate, busiestValue) =>
      `区间内共 ${total} 条${unit}，活跃日均 ${average} 条 · 最忙的一天是 ${busiestDate}（${busiestValue} 条）。`,
    foldersFooter: (addedLabel) =>
      `占比与条形均相对上级目录，${addedLabel}按文件创建时间统计。点目录名可逐层下钻。`,
    tooltipFolder: (name, count, pct) => `${name} · ${count} 篇（${pct}）`,
    factoryNotFound: (path) => `库内未找到文件夹：${path}`,
    factoryHint: (n) => `仅显示最近修改的 ${n} 条笔记`,
    factoryEmpty: "该目录下暂无笔记。",
    emptyNoteActivity:
      "未找到带日期信息的笔记（frontmatter 日期、文件名日期或修改时间），活跃度总览暂无数据。可在设置里调整数据源。",
    emptyChangelog: (paths) => `未在 ${paths} 找到迭代日志记录，活跃度总览暂无数据。`,
    logNotFound: (dateKey) => `迭代日志中没有 ${dateKey} 的记录`,
  },
  "zh-Hant": {
    settingsTitle: "知識庫儀表盤設置",
    language: "語言",
    languageDesc: "設定頁與儀表盤正文的介面語言。",
    localeName: LOCALE_NAMES,
    appearance: "外觀風格",
    appearanceDesc: "選擇儀表盤的視覺風格。更改後會立即應用到已打開的儀表盤。",
    dataSourceTitle: "數據源",
    dataSourceName: "活躍度資料來源",
    dataSourceDesc:
      "決定熱力圖按什麼統計。「筆記活躍度」在任意庫都能用；「迭代日誌」按 changelog 檔案解析（本庫原有行為）。",
    dataSourceNoteActivity: "筆記活躍度",
    dataSourceChangelog: "迭代日誌",
    activityDateFieldName: "活躍日期欄位",
    activityDateFieldDesc:
      "優先取筆記 frontmatter 的這個欄位作為活躍日期；取不到再依次回退 created / date → 檔名日期 → 檔案修改時間。",
    useMtimeName: "用檔案修改時間兜底",
    useMtimeDesc:
      "關閉時不用 mtime，避免同步盤（iCloud 等）批量刷新 mtime 造成「某天改幾千篇」的假柱。預設關閉。",
    excludedPrefixesName: "排除路徑",
    excludedPrefixesDesc: "每行一個路徑前綴，符合的筆記不計入任何統計；留空表示不排除。",
    changelogPathsName: "迭代日誌路徑",
    changelogPathsDesc: "每行一個檔案或資料夾路徑；資料夾取其下所有 .md（不遞迴）。",
    factoryTitle: "快捷入口",
    factoryDesc:
      "最多可配置 5 個板塊。每個板塊指定一個文件夾，儀表盤按該文件夾的子目錄出二級標籤、按修改時間列出筆記。" +
      "「文件夾路徑」留空則該板塊不顯示；填寫後若「顯示名稱」留空，自動取文件夾名並去掉編號前綴。" +
      "配置 2 個及以上板塊時，儀表盤上會出現一級標籤供切換。",
    slotName: (i) => `板塊 ${i}`,
    folderPlaceholder: "文件夾路徑，如 B_ContentFactory 內容工廠",
    labelPlaceholder: "顯示名稱（留空用文件夾名）",
    statusFound: "✓ 已找到該文件夾",
    statusNotFound: "⚠ 庫內未找到該路徑，請檢查大小寫與完整層級",

    appearanceNames: { modern: "Apple", y2k: "Y2K 控制臺", starbucks: "Starbucks 咖啡館" },
    dashboardTitle: "知識庫儀表盤",
    tabOverview: "總覽",
    tabFolders: "目錄",
    tabAll: "全部",
    rangeAll: "全部",
    range30d: "30天",
    range7d: "7天",
    rootLabel: "（庫根）",
    selfFiles: "（本層文件）",
    unitNote: "筆記",
    unitIteration: "迭代",
    statNoteCount: "筆記總數",
    statActiveDays: "活躍天數",
    statStreakLabel: "當前連續",
    streakDays: (n) => `${n}天`,
    statTopBlocks: "頂層區塊",
    statMaxDepth: (n) => `${n}層`,
    statRootScattered: "庫根散落",
    statMaxDepthLabel: "最深層級",
    foldersEmpty: "庫內暫無筆記。",
    addedInDays: (n) => `${n}天新增`,
    addedThisMonth: "本月新增",
    legendLess: "少",
    legendMore: "多",
    heatmapTooltipCount: (key, count, unit) => `${key} · ${count} 條${unit}`,
    heatmapTooltipEmpty: (key) => `${key} · 無記錄`,
    footerEmpty: (unit) => `該區間還沒有${unit}記錄。`,
    footerSummary: (total, unit, average, busiestDate, busiestValue) =>
      `區間內共 ${total} 條${unit}，活躍日均 ${average} 條 · 最忙的一天是 ${busiestDate}（${busiestValue} 條）。`,
    foldersFooter: (addedLabel) =>
      `佔比與條形均相對上級目錄，${addedLabel}按檔案建立時間統計。點目錄名可逐層下鑽。`,
    tooltipFolder: (name, count, pct) => `${name} · ${count} 篇（${pct}）`,
    factoryNotFound: (path) => `庫內未找到文件夾：${path}`,
    factoryHint: (n) => `僅顯示最近修改的 ${n} 條筆記`,
    factoryEmpty: "該目錄下暫無筆記。",
    emptyNoteActivity:
      "未找到帶日期資訊的筆記（frontmatter 日期、檔名日期或修改時間），活躍度總覽暫無資料。可在設定裡調整資料來源。",
    emptyChangelog: (paths) => `未在 ${paths} 找到迭代日誌記錄，活躍度總覽暫無資料。`,
    logNotFound: (dateKey) => `迭代日誌中沒有 ${dateKey} 的記錄`,
  },
  en: {
    settingsTitle: "Vault Dashboard X Settings",
    language: "Language",
    languageDesc: "Interface language for the settings page and the dashboard.",
    localeName: LOCALE_NAMES,
    appearance: "Appearance",
    appearanceDesc: "Choose the dashboard's visual style. Applies immediately to any open dashboard.",
    dataSourceTitle: "Data source",
    dataSourceName: "Activity data source",
    dataSourceDesc:
      "What the heatmap counts. \"Note activity\" works in any vault; \"Changelog\" parses changelog files (this vault's original behavior).",
    dataSourceNoteActivity: "Note activity",
    dataSourceChangelog: "Changelog",
    activityDateFieldName: "Activity date field",
    activityDateFieldDesc:
      "Prefer this frontmatter field as the activity date; then fall back to created/date → filename date → file modified time.",
    useMtimeName: "Fall back to file modified time",
    useMtimeDesc:
      "When off, mtime is not used, avoiding false spikes when a sync drive (iCloud, etc.) bulk-refreshes mtimes. Off by default.",
    excludedPrefixesName: "Excluded paths",
    excludedPrefixesDesc:
      "One path prefix per line. Matching notes are left out of every statistic. Leave empty to exclude nothing.",
    changelogPathsName: "Changelog paths",
    changelogPathsDesc: "One file or folder per line; a folder takes all .md inside (non-recursive).",
    factoryTitle: "Quick access",
    factoryDesc:
      "Configure up to 5 blocks. Each block points to a folder; the dashboard shows its subfolders as " +
      "second-level tabs and lists notes by modified time. Leave \"Folder path\" empty to hide the block; " +
      "if \"Display name\" is empty, the folder name (with any numeric prefix stripped) is used instead. " +
      "With 2 or more blocks configured, a top-level tab switcher appears on the dashboard.",
    slotName: (i) => `Block ${i}`,
    folderPlaceholder: "Folder path, e.g. B_ContentFactory 内容工厂",
    labelPlaceholder: "Display name (blank = use folder name)",
    statusFound: "✓ Folder found",
    statusNotFound: "⚠ Path not found in vault — check case and full path",

    appearanceNames: { modern: "Apple", y2k: "Y2K Console", starbucks: "Starbucks Café" },
    dashboardTitle: "Vault Dashboard X",
    tabOverview: "Overview",
    tabFolders: "Folders",
    tabAll: "All",
    rangeAll: "All",
    range30d: "30 days",
    range7d: "7 days",
    rootLabel: "Vault root",
    selfFiles: "Files here",
    unitNote: "notes",
    unitIteration: "iterations",
    statNoteCount: "Notes",
    statActiveDays: "Active days",
    statStreakLabel: "Current streak",
    streakDays: (n) => `${n} days`,
    statTopBlocks: "Top-level blocks",
    statMaxDepth: (n) => `${n} levels`,
    statRootScattered: "Root files",
    statMaxDepthLabel: "Max depth",
    foldersEmpty: "No notes in this vault yet.",
    addedInDays: (n) => `New in ${n} days`,
    addedThisMonth: "New this month",
    legendLess: "Less",
    legendMore: "More",
    heatmapTooltipCount: (key, count, unit) => `${key} · ${count} ${unit}`,
    heatmapTooltipEmpty: (key) => `${key} · No activity`,
    footerEmpty: (unit) => `No ${unit} in this range yet.`,
    footerSummary: (total, unit, average, busiestDate, busiestValue) =>
      `${total} ${unit} in range, avg ${average}/active day · busiest was ${busiestDate} (${busiestValue}).`,
    foldersFooter: (addedLabel) =>
      `Percentages and bars are relative to the parent folder. "${addedLabel}" counts files by creation time. Click a folder to drill down.`,
    tooltipFolder: (name, count, pct) => `${name} · ${count} notes (${pct})`,
    factoryNotFound: (path) => `Folder not found in vault: ${path}`,
    factoryHint: (n) => `Showing the ${n} most recently modified notes`,
    factoryEmpty: "No notes in this folder yet.",
    emptyNoteActivity:
      "No notes with a usable date were found (frontmatter date, filename date, or modified time). You can change the data source in settings.",
    emptyChangelog: (paths) =>
      `No changelog entries found in ${paths}. The activity overview has no data yet.`,
    logNotFound: (dateKey) => `No changelog entry for ${dateKey}`,
  },
  fr: {
    settingsTitle: "Paramètres de Vault Dashboard X",
    language: "Langue",
    languageDesc: "Langue de l'interface pour la page des paramètres et le tableau de bord.",
    localeName: LOCALE_NAMES,
    appearance: "Apparence",
    appearanceDesc:
      "Choisissez le style visuel du tableau de bord. S'applique immédiatement à tout tableau de bord ouvert.",
    dataSourceTitle: "Source de données",
    dataSourceName: "Source des données d'activité",
    dataSourceDesc:
      "Ce que compte la carte de chaleur. « Activité des notes » fonctionne dans tout coffre ; « Journal des modifications » analyse des fichiers de journal.",
    dataSourceNoteActivity: "Activité des notes",
    dataSourceChangelog: "Journal des modifications",
    activityDateFieldName: "Champ de date d'activité",
    activityDateFieldDesc:
      "Utiliser ce champ du frontmatter comme date d'activité, puis se rabattre sur created/date, la date du nom de fichier, puis la date de modification.",
    useMtimeName: "Se rabattre sur la date de modification",
    useMtimeDesc:
      "Désactivé, la date de modification n'est pas utilisée, ce qui évite les faux pics quand un service de synchronisation (iCloud, etc.) réécrit les dates en masse. Désactivé par défaut.",
    excludedPrefixesName: "Chemins exclus",
    excludedPrefixesDesc:
      "Un préfixe de chemin par ligne. Les notes correspondantes sont exclues de toutes les statistiques. Laisser vide pour ne rien exclure.",
    changelogPathsName: "Chemins du journal",
    changelogPathsDesc:
      "Un fichier ou dossier par ligne ; un dossier prend tous les .md qu'il contient (non récursif).",
    factoryTitle: "Accès rapide",
    factoryDesc:
      "Configurez jusqu'à 5 blocs. Chaque bloc pointe vers un dossier ; le tableau de bord affiche ses " +
      "sous-dossiers comme onglets de second niveau et liste les notes par date de modification. Laissez " +
      "« Chemin du dossier » vide pour masquer le bloc ; si « Nom affiché » est vide, le nom du dossier " +
      "(préfixe numérique retiré) est utilisé. À partir de 2 blocs configurés, un sélecteur d'onglets apparaît.",
    slotName: (i) => `Bloc ${i}`,
    folderPlaceholder: "Chemin du dossier, p. ex. B_ContentFactory 内容工厂",
    labelPlaceholder: "Nom affiché (vide = nom du dossier)",
    statusFound: "✓ Dossier trouvé",
    statusNotFound: "⚠ Chemin introuvable dans le coffre — vérifiez la casse et le chemin complet",

    appearanceNames: { modern: "Apple", y2k: "Console Y2K", starbucks: "Café Starbucks" },
    dashboardTitle: "Vault Dashboard X",
    tabOverview: "Aperçu",
    tabFolders: "Dossiers",
    tabAll: "Tout",
    rangeAll: "Tout",
    range30d: "30 jours",
    range7d: "7 jours",
    rootLabel: "Racine du coffre",
    selfFiles: "Fichiers ici",
    unitNote: "notes",
    unitIteration: "itérations",
    statNoteCount: "Notes",
    statActiveDays: "Jours actifs",
    statStreakLabel: "Série en cours",
    streakDays: (n) => `${n} jours`,
    statTopBlocks: "Blocs de premier niveau",
    statMaxDepth: (n) => `${n} niveaux`,
    statRootScattered: "Fichiers à la racine",
    statMaxDepthLabel: "Profondeur max",
    foldersEmpty: "Aucune note dans ce coffre pour l'instant.",
    addedInDays: (n) => `Ajoutées en ${n} jours`,
    addedThisMonth: "Ajoutées ce mois-ci",
    legendLess: "Moins",
    legendMore: "Plus",
    heatmapTooltipCount: (key, count, unit) => `${key} · ${count} ${unit}`,
    heatmapTooltipEmpty: (key) => `${key} · Aucune activité`,
    footerEmpty: (unit) => `Aucune ${unit} sur cette période.`,
    footerSummary: (total, unit, average, busiestDate, busiestValue) =>
      `${total} ${unit} sur la période, moy. ${average}/jour actif · pic le ${busiestDate} (${busiestValue}).`,
    foldersFooter: (addedLabel) =>
      `Les pourcentages et les barres sont relatifs au dossier parent. « ${addedLabel} » compte les fichiers par date de création. Cliquez sur un dossier pour l'explorer.`,
    tooltipFolder: (name, count, pct) => `${name} · ${count} notes (${pct})`,
    factoryNotFound: (path) => `Dossier introuvable dans le coffre : ${path}`,
    factoryHint: (n) => `Affiche les ${n} notes modifiées le plus récemment`,
    factoryEmpty: "Aucune note dans ce dossier pour l'instant.",
    emptyNoteActivity:
      "Aucune note avec une date exploitable n'a été trouvée (date du frontmatter, date du nom de fichier ou date de modification). Vous pouvez changer la source de données dans les paramètres.",
    emptyChangelog: (paths) =>
      `Aucune entrée de journal trouvée dans ${paths}. L'aperçu d'activité n'a pas encore de données.`,
    logNotFound: (dateKey) => `Aucune entrée de journal pour ${dateKey}`,
  },

  it: {
    settingsTitle: "Impostazioni di Vault Dashboard X",
    language: "Lingua",
    languageDesc: "Lingua dell'interfaccia per la pagina delle impostazioni e la dashboard.",
    localeName: LOCALE_NAMES,
    appearance: "Aspetto",
    appearanceDesc:
      "Scegli lo stile visivo della dashboard. Si applica subito a ogni dashboard aperta.",
    dataSourceTitle: "Origine dati",
    dataSourceName: "Origine dei dati di attività",
    dataSourceDesc:
      "Ciò che conta la mappa di calore. «Attività delle note» funziona in qualsiasi vault; «Changelog» analizza i file di changelog.",
    dataSourceNoteActivity: "Attività delle note",
    dataSourceChangelog: "Changelog",
    activityDateFieldName: "Campo data attività",
    activityDateFieldDesc:
      "Usa questo campo del frontmatter come data di attività; poi ripiega su created/date, sulla data nel nome file e infine sulla data di modifica.",
    useMtimeName: "Ripiega sulla data di modifica",
    useMtimeDesc:
      "Se disattivato, la data di modifica non viene usata, evitando falsi picchi quando un servizio di sincronizzazione (iCloud, ecc.) aggiorna in blocco le date. Disattivato per impostazione predefinita.",
    excludedPrefixesName: "Percorsi esclusi",
    excludedPrefixesDesc:
      "Un prefisso di percorso per riga. Le note corrispondenti sono escluse da ogni statistica. Lascia vuoto per non escludere nulla.",
    changelogPathsName: "Percorsi del changelog",
    changelogPathsDesc:
      "Un file o una cartella per riga; una cartella prende tutti i .md al suo interno (non ricorsivo).",
    factoryTitle: "Accesso rapido",
    factoryDesc:
      "Configura fino a 5 blocchi. Ogni blocco punta a una cartella; la dashboard mostra le sue " +
      "sottocartelle come schede di secondo livello ed elenca le note per data di modifica. Lascia " +
      "«Percorso della cartella» vuoto per nascondere il blocco; se «Nome visualizzato» è vuoto viene " +
      "usato il nome della cartella (senza prefisso numerico). Con 2 o più blocchi compare un selettore di schede.",
    slotName: (i) => `Blocco ${i}`,
    folderPlaceholder: "Percorso della cartella, es. B_ContentFactory 内容工厂",
    labelPlaceholder: "Nome visualizzato (vuoto = nome della cartella)",
    statusFound: "✓ Cartella trovata",
    statusNotFound: "⚠ Percorso non trovato nel vault — controlla maiuscole e percorso completo",

    appearanceNames: { modern: "Apple", y2k: "Console Y2K", starbucks: "Caffè Starbucks" },
    dashboardTitle: "Vault Dashboard X",
    tabOverview: "Panoramica",
    tabFolders: "Cartelle",
    tabAll: "Tutto",
    rangeAll: "Tutto",
    range30d: "30 giorni",
    range7d: "7 giorni",
    rootLabel: "Radice del vault",
    selfFiles: "File qui",
    unitNote: "note",
    unitIteration: "iterazioni",
    statNoteCount: "Note",
    statActiveDays: "Giorni attivi",
    statStreakLabel: "Serie attuale",
    streakDays: (n) => `${n} giorni`,
    statTopBlocks: "Blocchi di primo livello",
    statMaxDepth: (n) => `${n} livelli`,
    statRootScattered: "File nella radice",
    statMaxDepthLabel: "Profondità max",
    foldersEmpty: "Nessuna nota in questo vault.",
    addedInDays: (n) => `Nuove in ${n} giorni`,
    addedThisMonth: "Nuove questo mese",
    legendLess: "Meno",
    legendMore: "Più",
    heatmapTooltipCount: (key, count, unit) => `${key} · ${count} ${unit}`,
    heatmapTooltipEmpty: (key) => `${key} · Nessuna attività`,
    footerEmpty: (unit) => `Nessuna ${unit} in questo intervallo.`,
    footerSummary: (total, unit, average, busiestDate, busiestValue) =>
      `${total} ${unit} nell'intervallo, media ${average}/giorno attivo · picco il ${busiestDate} (${busiestValue}).`,
    foldersFooter: (addedLabel) =>
      `Percentuali e barre sono relative alla cartella superiore. «${addedLabel}» conta i file per data di creazione. Fai clic su una cartella per approfondire.`,
    tooltipFolder: (name, count, pct) => `${name} · ${count} note (${pct})`,
    factoryNotFound: (path) => `Cartella non trovata nel vault: ${path}`,
    factoryHint: (n) => `Mostra le ${n} note modificate più di recente`,
    factoryEmpty: "Nessuna nota in questa cartella.",
    emptyNoteActivity:
      "Non è stata trovata alcuna nota con una data utilizzabile (data nel frontmatter, data nel nome file o data di modifica). Puoi cambiare l'origine dati nelle impostazioni.",
    emptyChangelog: (paths) =>
      `Nessuna voce di changelog trovata in ${paths}. La panoramica delle attività non ha ancora dati.`,
    logNotFound: (dateKey) => `Nessuna voce di changelog per ${dateKey}`,
  },

  ja: {
    settingsTitle: "Vault Dashboard X の設定",
    language: "言語",
    languageDesc: "設定ページとダッシュボードの表示言語。",
    localeName: LOCALE_NAMES,
    appearance: "外観",
    appearanceDesc: "ダッシュボードの外観スタイルを選びます。開いているダッシュボードに即座に適用されます。",
    dataSourceTitle: "データソース",
    dataSourceName: "アクティビティのデータソース",
    dataSourceDesc:
      "ヒートマップが数える対象。「ノートの更新」はどの保管庫でも動作し、「変更履歴」は変更履歴ファイルを解析します（この保管庫の従来の挙動）。",
    dataSourceNoteActivity: "ノートの更新",
    dataSourceChangelog: "変更履歴",
    activityDateFieldName: "アクティビティ日付フィールド",
    activityDateFieldDesc:
      "この frontmatter フィールドを優先して活動日とし、なければ created/date、ファイル名の日付、更新日時の順に遡ります。",
    useMtimeName: "更新日時で代替する",
    useMtimeDesc:
      "オフのとき更新日時は使いません。iCloud などの同期で更新日時が一括で書き換わっても偽の山が出ません。既定はオフです。",
    excludedPrefixesName: "除外パス",
    excludedPrefixesDesc:
      "1 行につき 1 つのパス接頭辞。一致するノートはすべての統計から外れます。空欄なら除外しません。",
    changelogPathsName: "変更履歴のパス",
    changelogPathsDesc:
      "1 行につき 1 つのファイルまたはフォルダー。フォルダーは直下の .md をすべて取ります（再帰しません）。",
    factoryTitle: "クイックアクセス",
    factoryDesc:
      "最大 5 ブロックまで設定できます。各ブロックはフォルダーを指し、ダッシュボードはその" +
      "サブフォルダーを第 2 階層のタブとして表示し、更新日時順にノートを並べます。" +
      "「フォルダーのパス」を空欄にするとそのブロックは非表示になります。「表示名」が空欄なら" +
      "フォルダー名（先頭の連番を除いたもの）を使います。2 つ以上設定すると上部にタブ切り替えが出ます。",
    slotName: (i) => `ブロック ${i}`,
    folderPlaceholder: "フォルダーのパス（例：B_ContentFactory 内容工厂）",
    labelPlaceholder: "表示名（空欄ならフォルダー名）",
    statusFound: "✓ フォルダーが見つかりました",
    statusNotFound: "⚠ 保管庫内にパスが見つかりません — 大文字小文字と完全パスを確認してください",

    appearanceNames: { modern: "Apple", y2k: "Y2K コンソール", starbucks: "スターバックス カフェ" },
    dashboardTitle: "Vault Dashboard X",
    tabOverview: "概要",
    tabFolders: "フォルダー",
    tabAll: "すべて",
    rangeAll: "すべて",
    range30d: "30 日",
    range7d: "7 日",
    rootLabel: "保管庫のルート",
    selfFiles: "直下のファイル",
    unitNote: "件",
    unitIteration: "件",
    statNoteCount: "ノート数",
    statActiveDays: "活動日数",
    statStreakLabel: "継続日数",
    streakDays: (n) => `${n} 日`,
    statTopBlocks: "最上位ブロック",
    statMaxDepth: (n) => `${n} 階層`,
    statRootScattered: "ルート直下のファイル",
    statMaxDepthLabel: "最大階層",
    foldersEmpty: "この保管庫にはまだノートがありません。",
    addedInDays: (n) => `${n} 日間の新規`,
    addedThisMonth: "今月の新規",
    legendLess: "少",
    legendMore: "多",
    heatmapTooltipCount: (key, count, unit) => `${key} · ${count} ${unit}`,
    heatmapTooltipEmpty: (key) => `${key} · 活動なし`,
    footerEmpty: (unit) => `この期間の${unit}はありません。`,
    footerSummary: (total, unit, average, busiestDate, busiestValue) =>
      `期間内 ${total} ${unit}、活動日あたり平均 ${average} · 最多は ${busiestDate}（${busiestValue}）。`,
    foldersFooter: (addedLabel) =>
      `割合とバーは親フォルダーに対する値です。「${addedLabel}」は作成日時で数えます。フォルダーをクリックすると掘り下げます。`,
    tooltipFolder: (name, count, pct) => `${name} · ${count} 件（${pct}）`,
    factoryNotFound: (path) => `保管庫にフォルダーが見つかりません：${path}`,
    factoryHint: (n) => `最近更新された ${n} 件を表示しています`,
    factoryEmpty: "このフォルダーにはまだノートがありません。",
    emptyNoteActivity:
      "使用できる日付を持つノートが見つかりませんでした（frontmatter の日付、ファイル名の日付、更新日時のいずれも）。設定でデータソースを変更できます。",
    emptyChangelog: (paths) => `${paths} に変更履歴の項目が見つかりません。活動概要のデータはまだありません。`,
    logNotFound: (dateKey) => `${dateKey} の変更履歴項目がありません`,
  },

  ko: {
    settingsTitle: "Vault Dashboard X 설정",
    language: "언어",
    languageDesc: "설정 페이지와 대시보드의 인터페이스 언어입니다.",
    localeName: LOCALE_NAMES,
    appearance: "외관",
    appearanceDesc: "대시보드의 시각적 스타일을 선택합니다. 열려 있는 대시보드에 즉시 적용됩니다.",
    dataSourceTitle: "데이터 소스",
    dataSourceName: "활동 데이터 소스",
    dataSourceDesc:
      "히트맵이 세는 대상입니다. '노트 활동'은 모든 보관함에서 작동하고, '변경 기록'은 변경 기록 파일을 해석합니다(이 보관함의 기존 동작).",
    dataSourceNoteActivity: "노트 활동",
    dataSourceChangelog: "변경 기록",
    activityDateFieldName: "활동 날짜 필드",
    activityDateFieldDesc:
      "이 frontmatter 필드를 활동 날짜로 우선 사용하고, 없으면 created/date, 파일명 날짜, 수정 시각 순으로 대체합니다.",
    useMtimeName: "파일 수정 시각으로 대체",
    useMtimeDesc:
      "끄면 수정 시각을 사용하지 않아 iCloud 등 동기화가 수정 시각을 일괄 갱신해도 가짜 급증이 생기지 않습니다. 기본값은 꺼짐입니다.",
    excludedPrefixesName: "제외 경로",
    excludedPrefixesDesc:
      "한 줄에 경로 접두사 하나. 일치하는 노트는 모든 통계에서 제외됩니다. 비워 두면 아무것도 제외하지 않습니다.",
    changelogPathsName: "변경 기록 경로",
    changelogPathsDesc:
      "한 줄에 파일 또는 폴더 하나. 폴더는 바로 아래의 .md를 모두 가져옵니다(하위 폴더 제외).",
    factoryTitle: "바로가기",
    factoryDesc:
      "최대 5개 블록을 설정할 수 있습니다. 각 블록은 폴더를 가리키며, 대시보드는 그 하위 폴더를 " +
      "2단계 탭으로 표시하고 수정 시각순으로 노트를 나열합니다. '폴더 경로'를 비우면 해당 블록은 " +
      "숨겨집니다. '표시 이름'이 비어 있으면 폴더 이름(앞의 숫자 접두사를 뗀 것)을 사용합니다. " +
      "2개 이상 설정하면 상단에 탭 전환기가 나타납니다.",
    slotName: (i) => `블록 ${i}`,
    folderPlaceholder: "폴더 경로, 예: B_ContentFactory 内容工厂",
    labelPlaceholder: "표시 이름(비우면 폴더 이름 사용)",
    statusFound: "✓ 폴더를 찾았습니다",
    statusNotFound: "⚠ 보관함에서 경로를 찾을 수 없습니다 — 대소문자와 전체 경로를 확인하세요",

    appearanceNames: { modern: "Apple", y2k: "Y2K 콘솔", starbucks: "스타벅스 카페" },
    dashboardTitle: "Vault Dashboard X",
    tabOverview: "개요",
    tabFolders: "폴더",
    tabAll: "전체",
    rangeAll: "전체",
    range30d: "30일",
    range7d: "7일",
    rootLabel: "보관함 루트",
    selfFiles: "이 폴더의 파일",
    unitNote: "개",
    unitIteration: "건",
    statNoteCount: "노트 수",
    statActiveDays: "활동 일수",
    statStreakLabel: "현재 연속",
    streakDays: (n) => `${n}일`,
    statTopBlocks: "최상위 블록",
    statMaxDepth: (n) => `${n}단계`,
    statRootScattered: "루트 파일",
    statMaxDepthLabel: "최대 깊이",
    foldersEmpty: "이 보관함에는 아직 노트가 없습니다.",
    addedInDays: (n) => `${n}일간 신규`,
    addedThisMonth: "이번 달 신규",
    legendLess: "적음",
    legendMore: "많음",
    heatmapTooltipCount: (key, count, unit) => `${key} · ${count}${unit}`,
    heatmapTooltipEmpty: (key) => `${key} · 활동 없음`,
    footerEmpty: (unit) => `이 기간에는 ${unit}가 없습니다.`,
    footerSummary: (total, unit, average, busiestDate, busiestValue) =>
      `기간 내 ${total}${unit}, 활동일 평균 ${average} · 최다는 ${busiestDate}(${busiestValue}).`,
    foldersFooter: (addedLabel) =>
      `비율과 막대는 상위 폴더 기준입니다. '${addedLabel}'는 생성 시각으로 셉니다. 폴더를 클릭하면 하위로 들어갑니다.`,
    tooltipFolder: (name, count, pct) => `${name} · ${count}개 (${pct})`,
    factoryNotFound: (path) => `보관함에서 폴더를 찾을 수 없습니다: ${path}`,
    factoryHint: (n) => `최근 수정된 ${n}개를 표시합니다`,
    factoryEmpty: "이 폴더에는 아직 노트가 없습니다.",
    emptyNoteActivity:
      "사용할 수 있는 날짜를 가진 노트를 찾지 못했습니다(frontmatter 날짜, 파일명 날짜, 수정 시각 모두). 설정에서 데이터 소스를 바꿀 수 있습니다.",
    emptyChangelog: (paths) => `${paths}에서 변경 기록 항목을 찾지 못했습니다. 활동 개요에 데이터가 아직 없습니다.`,
    logNotFound: (dateKey) => `${dateKey}에 해당하는 변경 기록 항목이 없습니다`,
  },

  es: {
    settingsTitle: "Configuración de Vault Dashboard X",
    language: "Idioma",
    languageDesc: "Idioma de la interfaz para la página de ajustes y el panel.",
    localeName: LOCALE_NAMES,
    appearance: "Apariencia",
    appearanceDesc:
      "Elige el estilo visual del panel. Se aplica de inmediato a cualquier panel abierto.",
    dataSourceTitle: "Origen de datos",
    dataSourceName: "Origen de los datos de actividad",
    dataSourceDesc:
      "Lo que cuenta el mapa de calor. «Actividad de notas» funciona en cualquier bóveda; «Registro de cambios» analiza archivos de registro (el comportamiento original de esta bóveda).",
    dataSourceNoteActivity: "Actividad de notas",
    dataSourceChangelog: "Registro de cambios",
    activityDateFieldName: "Campo de fecha de actividad",
    activityDateFieldDesc:
      "Usa este campo del frontmatter como fecha de actividad; si falta, recurre a created/date, la fecha del nombre de archivo y la fecha de modificación.",
    useMtimeName: "Recurrir a la fecha de modificación",
    useMtimeDesc:
      "Si está desactivado, no se usa la fecha de modificación, evitando picos falsos cuando un servicio de sincronización (iCloud, etc.) las actualiza en bloque. Desactivado por defecto.",
    excludedPrefixesName: "Rutas excluidas",
    excludedPrefixesDesc:
      "Un prefijo de ruta por línea. Las notas coincidentes quedan fuera de todas las estadísticas. Déjalo vacío para no excluir nada.",
    changelogPathsName: "Rutas del registro",
    changelogPathsDesc:
      "Un archivo o carpeta por línea; una carpeta toma todos los .md que contiene (sin recursión).",
    factoryTitle: "Acceso rápido",
    factoryDesc:
      "Configura hasta 5 bloques. Cada bloque apunta a una carpeta; el panel muestra sus subcarpetas " +
      "como pestañas de segundo nivel y lista las notas por fecha de modificación. Deja «Ruta de la " +
      "carpeta» vacía para ocultar el bloque; si «Nombre visible» está vacío se usa el nombre de la " +
      "carpeta (sin el prefijo numérico). Con 2 o más bloques aparece un selector de pestañas.",
    slotName: (i) => `Bloque ${i}`,
    folderPlaceholder: "Ruta de la carpeta, p. ej. B_ContentFactory 内容工厂",
    labelPlaceholder: "Nombre visible (vacío = nombre de la carpeta)",
    statusFound: "✓ Carpeta encontrada",
    statusNotFound: "⚠ Ruta no encontrada en la bóveda — revisa mayúsculas y la ruta completa",

    appearanceNames: { modern: "Apple", y2k: "Consola Y2K", starbucks: "Café Starbucks" },
    dashboardTitle: "Vault Dashboard X",
    tabOverview: "Resumen",
    tabFolders: "Carpetas",
    tabAll: "Todo",
    rangeAll: "Todo",
    range30d: "30 días",
    range7d: "7 días",
    rootLabel: "Raíz de la bóveda",
    selfFiles: "Archivos aquí",
    unitNote: "notas",
    unitIteration: "iteraciones",
    statNoteCount: "Notas",
    statActiveDays: "Días activos",
    statStreakLabel: "Racha actual",
    streakDays: (n) => `${n} días`,
    statTopBlocks: "Bloques de nivel superior",
    statMaxDepth: (n) => `${n} niveles`,
    statRootScattered: "Archivos en la raíz",
    statMaxDepthLabel: "Profundidad máx.",
    foldersEmpty: "Aún no hay notas en esta bóveda.",
    addedInDays: (n) => `Nuevas en ${n} días`,
    addedThisMonth: "Nuevas este mes",
    legendLess: "Menos",
    legendMore: "Más",
    heatmapTooltipCount: (key, count, unit) => `${key} · ${count} ${unit}`,
    heatmapTooltipEmpty: (key) => `${key} · Sin actividad`,
    footerEmpty: (unit) => `No hay ${unit} en este intervalo.`,
    footerSummary: (total, unit, average, busiestDate, busiestValue) =>
      `${total} ${unit} en el intervalo, media ${average}/día activo · el día con más fue ${busiestDate} (${busiestValue}).`,
    foldersFooter: (addedLabel) =>
      `Los porcentajes y las barras son relativos a la carpeta superior. «${addedLabel}» cuenta los archivos por fecha de creación. Haz clic en una carpeta para explorarla.`,
    tooltipFolder: (name, count, pct) => `${name} · ${count} notas (${pct})`,
    factoryNotFound: (path) => `Carpeta no encontrada en la bóveda: ${path}`,
    factoryHint: (n) => `Mostrando las ${n} notas modificadas más recientemente`,
    factoryEmpty: "Aún no hay notas en esta carpeta.",
    emptyNoteActivity:
      "No se encontró ninguna nota con una fecha utilizable (fecha del frontmatter, fecha del nombre de archivo o fecha de modificación). Puedes cambiar el origen de datos en los ajustes.",
    emptyChangelog: (paths) =>
      `No se encontraron entradas de registro en ${paths}. El resumen de actividad aún no tiene datos.`,
    logNotFound: (dateKey) => `No hay entrada de registro para ${dateKey}`,
  },

};

/**
 * 顶层区块配色：首色即界面主色，其余为数据可视化用的识别色。
 * 设计规范只限制「可点击」信号统一用主色，图表多色不在此限。
 */
const PALETTE = [
  "var(--vd-primary, #0066cc)",
  "var(--vd-viz-purple, #7d5bd6)",
  "var(--vd-viz-cyan, #2a90a8)",
  "var(--vd-viz-green, #18864b)",
  "var(--vd-viz-amber, #a15c00)",
  "var(--vd-viz-pink, #c33d84)",
];
const PALETTE_REST = "var(--vd-ink-subtle, #7a7a7a)";

const RANGES = [
  { id: "all" },
  { id: "30d", days: 30 },
  { id: "7d", days: 7 },
];
const RANGE_LABEL_KEYS = { all: "rangeAll", "30d": "range30d", "7d": "range7d" };


/** `01_NewMediaCopy 新媒体文案` → `新媒体文案`；取不到中文名时退回原名 */
function factoryLabel(name) {
  const match = name.match(/^[\d-]+_\S*\s+(.+)$/);
  return match ? match[1] : name;
}

/* ---------------------------------- 日期工具 --------------------------------- */

function ymd(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseYmd(text) {
  const [y, m, d] = text.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 把 frontmatter 里可能出现的各种日期值规整成 'YYYY-MM-DD'。
 * 覆盖 'YYYY-MM-DD' 字符串、ISO 时间字符串、Date 对象、数字时间戳。
 */
function ymdFromValue(value) {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : ymd(value);
  if (typeof value === "number") return ymd(new Date(value));
  const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, delta) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + delta);
  return next;
}

/** 周一为一周之首：周一=0 … 周日=6 */
function weekdayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function diffDays(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86400000);
}

/** 占比文案：不足 0.1% 的显示为 <0.1%，避免一片 0.0% */
function percent(value, total) {
  if (!total) return "—";
  const ratio = (value / total) * 100;
  if (ratio > 0 && ratio < 0.1) return "<0.1%";
  return `${ratio.toFixed(1)}%`;
}

/* --------------------------------- 迭代日志解析 -------------------------------- */

/** 多个数据源合并到一张表：同一天的条目数相加 */
function mergeCounts(target, source) {
  for (const [day, count] of source) target.set(day, (target.get(day) || 0) + count);
  return target;
}

/**
 * 解析迭代日志，返回 Map<'YYYY-MM-DD', 条目数>。
 * 只数顶层列表项：一条迭代 = 一句话，与库内写法一致。
 */
function parseIterationLog(text) {
  const counts = new Map();
  let current = null;

  for (const line of text.split("\n")) {
    const dateHeading = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
    if (dateHeading) {
      current = dateHeading[1];
      if (!counts.has(current)) counts.set(current, 0);
      continue;
    }
    // 非日期的二级标题结束当前日期；三级及以下（### 分类）保持归属
    if (/^##\s/.test(line)) {
      current = null;
      continue;
    }
    if (!current) continue;
    if (/^\s*>/.test(line)) continue; // 引用块说明不计数
    if (/^ {0,3}[-*+]\s+\S/.test(line)) {
      counts.set(current, counts.get(current) + 1);
    }
  }
  return counts;
}

/* --------------------------------- 数据源 provider -------------------------------- */

/**
 * 单个笔记文件追溯出的「活跃日期」。
 * 回退链：frontmatter[activityDateField] → frontmatter.created → frontmatter.date
 *        → 文件名里的 YYYY-MM-DD → file.stat.mtime（仅当 settings.useMtime 开启）。
 * 全部取不到返回 null，该笔记不参与统计。
 */
function noteActivityDay(file, metadata, settings) {
  const fm = metadata?.frontmatter;
  if (fm) {
    const primary = ymdFromValue(fm[settings.activityDateField]);
    if (primary) return primary;
    const created = ymdFromValue(fm.created);
    if (created) return created;
    const dated = ymdFromValue(fm.date);
    if (dated) return dated;
  }
  const inName = file.basename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (inName) return inName[1];
  if (settings.useMtime) return ymd(new Date(file.stat.mtime));
  return null;
}

/** 笔记活跃度数据源：每篇笔记取一个活跃日期，按天计数（通用，任何库都能用）。 */
class NoteActivityProvider {
  constructor(settings) {
    this.settings = settings;
  }
  async getDailyCounts(app, notes) {
    const counts = new Map();
    for (const file of notes) {
      const cache = app.metadataCache.getFileCache(file);
      const day = noteActivityDay(file, cache, this.settings);
      if (day) counts.set(day, (counts.get(day) || 0) + 1);
    }
    return counts;
  }
}

/** 迭代日志数据源：解析 `## YYYY-MM-DD` 小节 + 顶层列表项（本库原有行为，保留为可选）。 */
class ChangelogProvider {
  constructor(settings) {
    this.settings = settings;
  }
  /** 收集全部日志文件：源是文件直接取，是文件夹就取其下所有 .md（不递归）。 */
  files(app) {
    const out = [];
    for (const source of this.settings.changelogPaths) {
      const entry = app.vault.getAbstractFileByPath(source);
      if (entry instanceof TFile) {
        if (entry.extension === "md") out.push(entry);
      } else if (entry instanceof TFolder) {
        for (const child of entry.children) {
          if (child instanceof TFile && child.extension === "md") out.push(child);
        }
      }
    }
    return out;
  }
  async getDailyCounts(app) {
    const counts = new Map();
    for (const file of this.files(app)) {
      mergeCounts(counts, parseIterationLog(await app.vault.cachedRead(file)));
    }
    return counts;
  }
}

/* ---------------------------------- 统计计算 --------------------------------- */

/** 当前连续天数：今天没记录时不算断档，从昨天起回溯 */
function currentStreak(counts, today) {
  let cursor = startOfDay(today);
  if (!counts.get(ymd(cursor))) cursor = addDays(cursor, -1);

  let streak = 0;
  while (counts.get(ymd(cursor)) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * 强度分档：对区间内的非零值取四分位，避免峰值（36 条）把日常量压成一片浅色。
 * 返回 value → 0..4 的映射函数。
 */
function buildLevelScale(values) {
  const nonZero = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) return () => 0;

  const quantile = (q) => nonZero[Math.min(nonZero.length - 1, Math.floor(nonZero.length * q))];
  const cuts = [quantile(0.25), quantile(0.5), quantile(0.75)];

  return (value) => {
    if (!value) return 0;
    if (value <= cuts[0]) return 1;
    if (value <= cuts[1]) return 2;
    if (value <= cuts[2]) return 3;
    return 4;
  };
}

/* --------------------------------- 目录分布 --------------------------------- */

/**
 * 按路径聚合成目录树。每个节点的 count 含全部下级笔记，
 * 因此顶层区块数相加 = 全库笔记数（库根散落笔记归入「（库根）」）。
 */
function buildFolderTree(files, sinceMs) {
  const makeNode = (name, path) => ({
    name,
    path,
    count: 0, // 含全部下级
    direct: 0, // 直接放在本层的笔记
    added: 0,
    children: new Map(),
  });
  const root = makeNode("", "");
  let maxDepth = 0;

  for (const file of files) {
    const parts = file.path.split("/");
    const dirs = parts.slice(0, -1);
    const chain = dirs.length ? dirs : [ROOT_KEY];
    const isNew = file.stat.ctime >= sinceMs;

    maxDepth = Math.max(maxDepth, dirs.length);
    root.count += 1;
    if (isNew) root.added += 1;

    let node = root;
    let path = "";
    for (const part of chain) {
      path = path ? `${path}/${part}` : part;
      if (!node.children.has(part)) node.children.set(part, makeNode(part, path));
      node = node.children.get(part);
      node.count += 1;
      if (isNew) node.added += 1;
    }
    node.direct += 1;
  }

  return { root, maxDepth };
}

/** 按笔记数降序取子节点 */
function sortedChildren(node) {
  return [...node.children.values()].sort((a, b) => b.count - a.count);
}

/* ----------------------------------- 视图 ----------------------------------- */

class DashboardView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.tab = "overview";
    this.range = "all";
    this.counts = new Map();
    this.empty = false;
    this._notes = null; // 全库笔记列表缓存（create/delete/rename 时失效）
    this._fileDates = null; // noteActivity 增量映射 path→'YYYY-MM-DD'；null 表示需全量重建
    this._dirtyNotes = new Set(); // 防抖窗口内改动过的笔记路径，refresh 时做增量
    this.expanded = new Set(); // 目录页展开的节点路径
    this.factorySlotPath = null; // 内容工厂当前选中板块（设置里配置的文件夹路径），null = 未初始化
    this.factoryL2 = null; // 内容工厂二级标签：子目录路径，null = 全部
    this._sliderIdx = {}; // 各标签组上一次选中的序号，用于高亮滑块的起点
  }

  /**
   * 高亮滑块：点击标签会走 render() 整体重建 DOM，CSS 过渡接不上前一状态，
   * 故记住上一次选中序号——重建后先无动画落到旧位，下一帧再过渡到新位，
   * 视觉上即为滑动。组内容变化（如切换一级标签导致二级标签换了一批）时
   * 旧序号失效，直接落到新位不做动画。
   */
  mountSlider(container, key) {
    const items = [...container.children];
    const activeIndex = items.findIndex((el) => el.classList.contains("is-active"));
    if (activeIndex < 0) return;

    const slider = container.createDiv({ cls: "vdash-slider" });
    container.prepend(slider);

    const place = (idx, animate) => {
      const el = items[idx];
      if (!el) return false;
      slider.style.transition = animate ? "" : "none";
      slider.style.width = `${el.offsetWidth}px`;
      slider.style.height = `${el.offsetHeight}px`;
      slider.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
      return true;
    };

    const prev = this._sliderIdx[key];
    const from = Number.isInteger(prev) && items[prev] ? prev : activeIndex;
    this._sliderIdx[key] = activeIndex;

    // 必须等版面落定再量：render() 进行中标签尚未套上 flex 与 min-height，
    // 此时 offsetWidth 拿到的是块级全宽，滑块会画成一整条。
    window.requestAnimationFrame(() => {
      if (!slider.isConnected) return;
      place(from, false);
      if (from !== activeIndex) {
        void slider.offsetWidth; // 强制回流，确保起点落定后才开过渡
        window.requestAnimationFrame(() => place(activeIndex, true));
      }
    });
  }

  /** 当前 locale 的字典（缺省回退默认）。 */
  localeDict() {
    return I18N[this.plugin.settings.locale] || I18N[DEFAULT_LOCALE];
  }

  /** 取翻译文案；值为函数时按插值调用。 */
  t(key, ...args) {
    const v = this.localeDict()[key];
    return typeof v === "function" ? v(...args) : v;
  }

  rangeLabel(id) {
    return this.t(RANGE_LABEL_KEYS[id]);
  }

  nfmt(n) {
    return formatNumber(n, this.plugin.settings.locale);
  }

  /** 目录树节点显示名：内部「库根」键翻译为当前语言。 */
  folderName(name) {
    return name === ROOT_KEY ? this.t("rootLabel") : name;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return this.localeDict().dashboardTitle;
  }

  getIcon() {
    return "layout-dashboard";
  }

  /** 当前数据源下，判一个文件改动是否会影响热力图（用于事件监听防抖）。 */
  isDataPath(path) {
    if (this.plugin.settings.dataSource === "changelog") {
      return this.plugin.settings.changelogPaths.some(
        (p) => path === p || path.startsWith(`${p}/`),
      );
    }
    return path.endsWith(".md");
  }

  /** 当前统计口径的名称单位：迭代 vs 笔记（用于脚注/提示文案）。 */
  dataUnit() {
    return this.plugin.settings.dataSource === "changelog"
      ? this.t("unitIteration")
      : this.t("unitNote");
  }

  /** changelog 模式下的日志文件清单；非 changelog 模式返回空。 */
  changelogFiles() {
    if (this.plugin.settings.dataSource !== "changelog") return [];
    return new ChangelogProvider(this.plugin.settings).files(this.app);
  }

  async onOpen() {
    this.contentEl.addClass("vdash-content");
    await this.refresh();

    // 数据源一改动就刷新（防抖，避免连续写入时重复渲染）
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (this.isDataPath(file.path)) {
          if (this.plugin.settings.dataSource === "noteActivity") this._dirtyNotes.add(file.path);
          this.scheduleRefresh();
        } else if (this.factoryWatchPrefixes().some((p) => file.path.startsWith(p))) {
          this.scheduleRefresh();
        }
      }),
    );

    // 内容工厂各板块文件夹增删改名后列表要跟着变；同时失效笔记缓存
    for (const evt of ["create", "delete", "rename"]) {
      this.registerEvent(
        this.app.vault.on(evt, (file) => {
          this._notes = null;
          if (this.plugin.settings.dataSource === "noteActivity") this._fileDates = null;
          if (this.isDataPath(file.path)) this.scheduleRefresh();
          else if (this.factoryWatchPrefixes().some((p) => file.path.startsWith(p))) this.scheduleRefresh();
        }),
      );
    }
  }

  async onClose() {
    window.clearTimeout(this.refreshTimer);
    this.contentEl.empty();
  }

  scheduleRefresh() {
    window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => this.refresh(), 800);
  }

  async refresh() {
    if (this.plugin.settings.dataSource === "noteActivity") {
      if (this._fileDates === null) {
        await this.recomputeNoteActivity();
        this._dirtyNotes.clear();
      } else {
        // 增量更新防抖窗口内改动过的笔记，其余沿用缓存，避免整库重扫
        const dirty = [...this._dirtyNotes];
        this._dirtyNotes.clear();
        for (const path of dirty) {
          const file = this.app.vault.getAbstractFileByPath(path);
          if (
            file instanceof TFile &&
            file.extension === "md" &&
            !isExcluded(file.path, this.plugin.settings.excludedPrefixes)
          ) {
            this.applyNoteDelta(file);
          }
        }
      }
    } else {
      const provider = this.plugin.getProvider();
      this.counts = await provider.getDailyCounts(this.app);
    }
    // 文件存在但一条日期都没有（如只剩总纲）同样算无数据
    this.empty = this.counts.size === 0;
    this.render();
  }

  /** noteActivity 全量重建：provider 出 counts，再补建 path→day 映射供后续增量更新。 */
  async recomputeNoteActivity() {
    const provider = this.plugin.getProvider();
    const notes = this.vaultNotes();
    this.counts = await provider.getDailyCounts(this.app, notes);
    const fileDates = new Map();
    for (const file of notes) {
      const cache = this.app.metadataCache.getFileCache(file);
      const day = noteActivityDay(file, cache, this.plugin.settings);
      if (day) fileDates.set(file.path, day);
    }
    this._fileDates = fileDates;
  }

  /** noteActivity 单篇增量：重算该笔记活跃日，增减 counts 与映射。 */
  applyNoteDelta(file) {
    const prev = this._fileDates.get(file.path);
    const cache = this.app.metadataCache.getFileCache(file);
    const next = noteActivityDay(file, cache, this.plugin.settings);
    if (prev === next) return;
    if (prev) {
      const v = (this.counts.get(prev) || 0) - 1;
      if (v > 0) this.counts.set(prev, v);
      else this.counts.delete(prev);
    }
    if (next) {
      this.counts.set(next, (this.counts.get(next) || 0) + 1);
      this._fileDates.set(file.path, next);
    } else {
      this._fileDates.delete(file.path);
    }
  }

  /** 让计数缓存失效并重算（数据源或判定规则变更时用）。 */
  invalidate() {
    this._fileDates = null;
    // 排除路径变更会改变全库笔记集合，缓存一并作废
    this._notes = null;
    this._dirtyNotes.clear();
    this.refresh();
  }

  emptyMessage() {
    if (this.plugin.settings.dataSource === "changelog") {
      return this.t("emptyChangelog", this.plugin.settings.changelogPaths.join(", "));
    }
    return this.t("emptyNoteActivity");
  }

  /* ------------------------------- 区间与统计 ------------------------------ */

  rangeBounds() {
    const today = startOfDay(new Date());
    const preset = RANGES.find((r) => r.id === this.range);

    if (preset.days) return { start: addDays(today, -(preset.days - 1)), end: today };

    // 全部：从最早有记录的一天起；封顶 MAX_WEEKS 周，避免异常跨度（如笔记活跃度含离群日期）拖垮热力图渲染
    const dates = [...this.counts.keys()].sort();
    const start = dates.length ? parseYmd(dates[0]) : addDays(today, -29);
    const floor = addDays(today, -(MAX_WEEKS * 7 - 1));
    const clamped = start < floor ? floor : start;
    return { start: clamped > today ? today : clamped, end: today };
  }

  /**
   * 「新增」统计窗口：按文件创建时间算。
   * 全部区间取本月，短区间取该区间——两个标签页共用同一口径。
   */
  addedWindow(start) {
    const preset = RANGES.find((r) => r.id === this.range);
    if (preset.days) return { since: start.getTime(), label: this.t("addedInDays", preset.days) };

    const today = startOfDay(new Date());
    return {
      since: new Date(today.getFullYear(), today.getMonth(), 1).getTime(),
      label: this.t("addedThisMonth"),
    };
  }

  /** 全库笔记数（扣除用户配置的排除前缀），带缓存：create/delete/rename 时失效。 */
  vaultNotes() {
    if (this._notes) return this._notes;
    const prefixes = this.plugin.settings.excludedPrefixes;
    this._notes = this.app.vault.getMarkdownFiles().filter((f) => !isExcluded(f.path, prefixes));
    return this._notes;
  }

  collectStats(start, end) {
    let activeDays = 0;
    let total = 0;
    let busiest = null;

    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const value = this.counts.get(ymd(d)) || 0;
      if (value > 0) {
        activeDays += 1;
        total += value;
        if (!busiest || value > busiest.value) busiest = { date: ymd(d), value };
      }
    }

    const { since: addedSince, label: addedLabel } = this.addedWindow(start);
    const added = this.vaultNotes().filter((f) => f.stat.ctime >= addedSince).length;

    return {
      activeDays,
      total,
      busiest,
      added,
      addedLabel,
      noteCount: this.vaultNotes().length,
      streak: currentStreak(this.counts, startOfDay(new Date())),
    };
  }

  /* -------------------------------- 渲染 -------------------------------- */

  applyAppearance() {
    this.contentEl.removeClass("vdash-style-universal");
    for (const id of APPEARANCE_IDS) {
      this.contentEl.removeClass(`vdash-style-${id}`);
    }
    this.contentEl.addClass(`vdash-style-${this.plugin.settings.appearance}`);
  }

  render() {
    const el = this.contentEl;
    el.empty();
    this.applyAppearance();
    if (this.tab !== "overview" && this.tab !== "folders") this.tab = "overview";

    // 底色画在自建的 stage 上：主题对 .view-content 的规则压不到自定义类，
    // 直接给 contentEl 上色会被主题覆盖（除非 !important）。
    const stage = el.createDiv({ cls: "vdash-stage" });
    const panel = stage.createDiv({ cls: "vdash-panel" });
    const primary = panel.createDiv({ cls: "vdash-primary" });
    this.renderHeader(primary);

    if (this.tab === "folders") {
      this.renderFolders(primary);
    } else if (this.empty) {
      primary.createDiv({ cls: "vdash-empty" }).setText(this.emptyMessage());
    } else {
      const { start, end } = this.rangeBounds();
      const stats = this.collectStats(start, end);

      this.renderStatCards(primary, stats);
      this.renderHeatmap(primary, start, end);
      this.renderFooter(primary, stats);
    }

    this.renderFactory(panel);
  }

  renderHeader(parent) {
    const header = parent.createDiv({ cls: "vdash-header" });

    const tabs = header.createDiv({ cls: "vdash-tabs" });
    for (const [id, label] of [["overview", this.t("tabOverview")], ["folders", this.t("tabFolders")]]) {
      const tab = tabs.createDiv({
        cls: `vdash-tab${this.tab === id ? " is-active" : ""}`,
        text: label,
      });
      tab.addEventListener("click", () => {
        this.tab = id;
        this.render();
      });
    }
    this.mountSlider(tabs, "tabs");

    const switcher = header.createDiv({ cls: "vdash-range" });
    for (const preset of RANGES) {
      const btn = switcher.createDiv({
        cls: `vdash-range-btn${this.range === preset.id ? " is-active" : ""}`,
        text: this.rangeLabel(preset.id),
      });
      btn.addEventListener("click", () => {
        this.range = preset.id;
        this.render();
      });
    }
    this.mountSlider(switcher, "range");
  }

  renderStatCards(parent, stats) {
    this.renderCards(parent, [
      { label: this.t("statNoteCount"), value: this.nfmt(stats.noteCount) },
      { label: stats.addedLabel, value: this.nfmt(stats.added) },
      { label: this.t("statActiveDays"), value: stats.activeDays },
      { label: this.t("statStreakLabel"), value: this.t("streakDays", stats.streak) },
    ]);
  }

  renderCards(parent, cards) {
    const grid = parent.createDiv({ cls: "vdash-cards" });
    for (const card of cards) {
      const box = grid.createDiv({ cls: "vdash-card" });
      box.createDiv({ cls: "vdash-card-label", text: card.label });
      box.createDiv({ cls: "vdash-card-value", text: String(card.value) });
    }
  }

  renderHeatmap(parent, start, end) {
    const span = diffDays(start, end) + 1;
    // 短区间铺成一条日历带，长区间用 GitHub 式周网格
    const stripMode = span <= 31;

    const values = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      values.push(this.counts.get(ymd(d)) || 0);
    }
    const levelOf = buildLevelScale(values);

    const wrap = parent.createDiv({
      cls: `vdash-heatmap${stripMode ? " is-strip" : ""}`,
    });
    // 带状模式格子数少，放大格子避免铺不满；周网格用固定格宽由间距撑开
    wrap.style.setProperty("--vdash-cell", stripMode && span <= 10 ? "40px" : null);

    let gridStart = stripMode ? start : addDays(start, -weekdayIndex(start));
    const gridEnd = stripMode ? end : addDays(end, 6 - weekdayIndex(end));
    let columns = stripMode ? span : (diffDays(gridStart, gridEnd) + 1) / 7;

    // 周网格保底铺满一屏：数据不足 MIN_WEEKS 时向前补空周，避免网格缩在左上角
    if (!stripMode && columns < MIN_WEEKS) {
      gridStart = addDays(gridStart, -(MIN_WEEKS - columns) * 7);
      columns = MIN_WEEKS;
    }

    if (!stripMode) this.renderMonthLabels(wrap, gridStart, columns);

    const grid = wrap.createDiv({ cls: "vdash-grid" });
    grid.style.setProperty("--vdash-rows", stripMode ? "1" : "7");
    grid.style.setProperty("--vdash-cols", String(columns));

    const unit = this.dataUnit();
    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
      const key = ymd(d);

      // 今天之后的格子留空；区间之前的补白格按「无记录」显示
      if (d > end) {
        grid.createDiv({ cls: "vdash-cell is-void" });
        continue;
      }
      if (d < start) {
        grid.createDiv({ cls: "vdash-cell level-0 is-pad" });
        continue;
      }

      const value = this.counts.get(key) || 0;
      const cell = grid.createDiv({ cls: `vdash-cell level-${levelOf(value)}` });
      setTooltip?.(
        cell,
        value ? this.t("heatmapTooltipCount", key, value, unit) : this.t("heatmapTooltipEmpty", key),
        { placement: "top" },
      );
      // 只有迭代日志模式才有点格子跳转对应小节的能力（笔记活跃度无单一落点）
      if (this.plugin.settings.dataSource === "changelog") {
        cell.addEventListener("click", () => this.openLogAt(key));
      }
    }

    this.renderLegend(wrap);
  }

  renderMonthLabels(parent, gridStart, columns) {
    const row = parent.createDiv({ cls: "vdash-months" });
    row.style.setProperty("--vdash-cols", String(columns));

    let lastMonth = -1;
    for (let col = 0; col < columns; col++) {
      const weekStart = addDays(gridStart, col * 7);
      const cell = row.createDiv({ cls: "vdash-month" });
      if (weekStart.getMonth() !== lastMonth) {
        lastMonth = weekStart.getMonth();
        cell.setText(monthShort(weekStart, this.plugin.settings.locale));
      }
    }
  }

  renderLegend(parent) {
    const legend = parent.createDiv({ cls: "vdash-legend" });
    legend.createSpan({ text: this.t("legendLess") });
    for (let level = 0; level <= 4; level++) {
      legend.createDiv({ cls: `vdash-cell level-${level}` });
    }
    legend.createSpan({ text: this.t("legendMore") });
  }

  renderFooter(parent, stats) {
    const footer = parent.createDiv({ cls: "vdash-footer" });
    if (!stats.total) {
      footer.setText(this.t("footerEmpty", this.dataUnit()));
      return;
    }
    const average = (stats.total / stats.activeDays).toFixed(1);
    footer.setText(
      this.t("footerSummary", stats.total, this.dataUnit(), average, stats.busiest.date, stats.busiest.value),
    );
  }

  /* ------------------------------- 目录分布页 ------------------------------- */

  renderFolders(parent) {
    const { start } = this.rangeBounds();
    const { since, label: addedLabel } = this.addedWindow(start);
    const { root, maxDepth } = buildFolderTree(this.vaultNotes(), since);
    const tops = sortedChildren(root);

    if (!root.count) {
      parent.createDiv({ cls: "vdash-empty" }).setText(this.t("foldersEmpty"));
      return;
    }

    this.renderCards(parent, [
      { label: this.t("statNoteCount"), value: this.nfmt(root.count) },
      { label: this.t("statTopBlocks"), value: tops.length },
      { label: this.t("statMaxDepthLabel"), value: this.t("statMaxDepth", maxDepth) },
      { label: this.t("statRootScattered"), value: root.children.get(ROOT_KEY)?.count || 0 },
    ]);

    const colorOf = new Map(
      tops.map((node, i) => [node.path, i < PALETTE.length ? PALETTE[i] : PALETTE_REST]),
    );

    this.renderStackBar(parent, tops, root.count, colorOf);

    const list = parent.createDiv({ cls: "vdash-rows" });
    this.renderFolderRows(list, tops, 0, root.count, (node) => colorOf.get(node.path));

    parent
      .createDiv({ cls: "vdash-footer" })
      .setText(this.t("foldersFooter", addedLabel));
  }

  renderStackBar(parent, nodes, total, colorOf) {
    const bar = parent.createDiv({ cls: "vdash-stack" });
    for (const node of nodes) {
      const seg = bar.createDiv({ cls: "vdash-stack-seg" });
      seg.style.flexGrow = String(node.count);
      seg.style.backgroundColor = colorOf.get(node.path);
      setTooltip?.(seg, this.t("tooltipFolder", this.folderName(node.name), node.count, percent(node.count, total)), {
        placement: "top",
      });
    }
  }

  /**
   * 逐层渲染目录行。子行追加进同一个容器、靠缩进表达层级，
   * 这样各层的数量/占比列始终对齐。
   */
  renderFolderRows(container, nodes, depth, parentCount, colorFor) {
    for (const node of nodes) {
      const color = colorFor(node);
      const hasChildren = node.children.size > 0;
      const isOpen = this.expanded.has(node.path);

      const row = container.createDiv({
        cls: `vdash-row${hasChildren ? " is-openable" : ""}`,
      });

      const name = row.createDiv({ cls: "vdash-row-name" });
      name.style.paddingLeft = `${depth * 16}px`;
      name.createSpan({
        cls: `vdash-caret${hasChildren ? "" : " is-leaf"}${isOpen ? " is-open" : ""}`,
        text: hasChildren ? "▸" : "·",
      });
      name.createSpan({ cls: "vdash-row-text", text: this.folderName(node.name) });
      if (node.added > 0) {
        name.createSpan({ cls: "vdash-row-added", text: `+${node.added}` });
      }

      // 条形宽度 = 相对上级目录的占比，与右侧百分比同源，避免同级归一造成多层「都满格」
      const track = row.createDiv({ cls: "vdash-row-bar" });
      const fill = track.createDiv({ cls: "vdash-row-fill" });
      fill.style.width = `${parentCount ? (node.count / parentCount) * 100 : 0}%`;
      fill.style.backgroundColor = color;

      row.createDiv({ cls: "vdash-row-count", text: this.nfmt(node.count) });
      row.createDiv({ cls: "vdash-row-pct", text: percent(node.count, parentCount) });

      if (!hasChildren) continue;

      row.addEventListener("click", () => {
        if (isOpen) this.expanded.delete(node.path);
        else this.expanded.add(node.path);
        this.render();
      });

      if (!isOpen) continue;

      const children = sortedChildren(node);
      // 直接放在本层的笔记单独列一行，否则子行相加对不上本层总数
      if (node.direct > 0) {
        children.push({
          name: this.t("selfFiles"),
          path: `${node.path}//self`,
          count: node.direct,
          direct: 0,
          added: 0,
          children: new Map(),
        });
        children.sort((a, b) => b.count - a.count);
      }
      this.renderFolderRows(container, children, depth + 1, node.count, () => color);
    }
  }

  /* ------------------------------ 内容工厂快捷入口 ----------------------------- */

  /**
   * 读取设置里最多 5 个自定义板块：folder 留空即视为未配置、不出现在仪表盘。
   * label 留空则回退为文件夹名（去掉编号前缀），彻底留空的板块两者皆无则不返回。
   */
  getFactorySlots() {
    const tabs = this.plugin.settings.factoryTabs || [];
    const slots = [];
    for (const raw of tabs) {
      const folder = (raw?.folder || "").trim();
      if (!folder) continue;
      const customLabel = (raw?.label || "").trim();
      const baseName = folder.split("/").filter(Boolean).pop() || folder;
      slots.push({ path: folder, label: customLabel || factoryLabel(baseName) });
    }
    return slots;
  }

  /** 供 onOpen 的事件监听判断文件改动是否落在任一已配置板块内 */
  factoryWatchPrefixes() {
    return this.getFactorySlots().map((s) => `${s.path}/`);
  }

  /** 指定目录（含全部子目录）下的笔记，按修改时间倒序 */
  factoryNotes(folderPath) {
    const base = `${folderPath}/`;
    return this.vaultNotes()
      .filter((f) => f.path.startsWith(base))
      .sort((a, b) => b.stat.mtime - a.stat.mtime);
  }

  renderFactory(parent) {
    const slots = this.getFactorySlots();
    // 一个板块都没配置时整块不出现，不留空标题
    if (!slots.length) return;

    const box = parent.createDiv({ cls: "vdash-factory" });
    box.createDiv({ cls: "vdash-factory-title", text: this.t("factoryTitle") });

    // 选中板块被删配置或改路径后失效，回落第一个
    if (!slots.some((s) => s.path === this.factorySlotPath)) {
      this.factorySlotPath = slots[0].path;
      this.factoryL2 = null;
    }

    if (slots.length > 1) {
      const l1 = box.createDiv({ cls: "vdash-factory-tabs" });
      for (const slot of slots) {
        this.factoryTab(l1, slot.label, this.factorySlotPath === slot.path, () => {
          this.factorySlotPath = slot.path;
          this.factoryL2 = null;
        });
      }
      this.mountSlider(l1, "factoryL1");
    }

    const current = this.app.vault.getAbstractFileByPath(this.factorySlotPath);
    if (!current || !current.children) {
      box.createDiv({ cls: "vdash-empty" }).setText(this.t("factoryNotFound", this.factorySlotPath));
      return;
    }

    const subs = current.children
      .filter((f) => f.children)
      .sort((a, b) => a.name.localeCompare(b.name, INTL_LOCALE[this.plugin.settings.locale] || "en"));

    if (subs.length) {
      if (this.factoryL2 && !subs.some((f) => f.path === this.factoryL2)) this.factoryL2 = null;
      const l2 = box.createDiv({ cls: "vdash-factory-tabs is-sub" });
      this.factoryTab(l2, this.t("tabAll"), !this.factoryL2, () => {
        this.factoryL2 = null;
      });
      for (const sub of subs) {
        this.factoryTab(l2, factoryLabel(sub.name), this.factoryL2 === sub.path, () => {
          this.factoryL2 = sub.path;
        });
      }
      this.mountSlider(l2, `factoryL2:${this.factorySlotPath}`);
    } else {
      // 该板块没有子目录，二级标签整行不出
      this.factoryL2 = null;
    }

    const files = this.factoryNotes(this.factoryL2 || this.factorySlotPath).slice(0, FACTORY_RECENT_LIMIT);
    this.renderFactoryList(box, files);
    box
      .createDiv({ cls: "vdash-factory-hint" })
      .setText(this.t("factoryHint", FACTORY_RECENT_LIMIT));
  }

  factoryTab(parent, label, active, onPick) {
    const tab = parent.createDiv({
      cls: `vdash-factory-tab${active ? " is-active" : ""}`,
      text: label,
    });
    tab.addEventListener("click", () => {
      onPick();
      this.render();
    });
  }

  renderFactoryList(parent, files) {
    if (!files.length) {
      parent.createDiv({ cls: "vdash-empty" }).setText(this.t("factoryEmpty"));
      return;
    }

    const list = parent.createDiv({ cls: "vdash-factory-list" });
    for (const file of files) {
      const row = list.createDiv({ cls: "vdash-factory-item" });

      const link = row.createEl("a", {
        cls: "vdash-factory-link",
        text: file.basename,
        href: "#",
      });
      setTooltip?.(link, file.path, { placement: "top" });
      link.addEventListener("click", (evt) => {
        evt.preventDefault();
        this.openInNewTab(file);
      });

      row.createSpan({
        cls: "vdash-factory-date",
        text: ymd(new Date(file.stat.mtime)),
      });
    }
  }

  /** 笔记一律开在新标签页，不顶掉仪表盘本身 */
  async openInNewTab(file) {
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
    this.app.workspace.revealLeaf(leaf);
  }

  /**
   * 点格子跳到迭代日志对应日期小节。
   * 日志按月拆分后要先在多个文件里找出哪一份含这一天。
   */
  async openLogAt(dateKey) {
    let target = null;
    for (const file of this.changelogFiles()) {
      const text = await this.app.vault.cachedRead(file);
      const line = text.split("\n").findIndex((l) => l.startsWith(`## ${dateKey}`));
      if (line >= 0) {
        target = { file, line };
        break;
      }
    }
    if (!target) {
      new Notice(this.t("logNotFound", dateKey));
      return;
    }

    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(target.file);
    leaf.view.editor?.setCursor({ line: target.line, ch: 0 });
    leaf.view.editor?.scrollIntoView(
      { from: { line: target.line, ch: 0 }, to: { line: target.line, ch: 0 } },
      true,
    );
  }
}

/* ----------------------------------- 插件 ----------------------------------- */

class VaultDashboardSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    const t = I18N[this.plugin.settings.locale] || I18N[DEFAULT_LOCALE];

    containerEl.createEl("h2", { text: t.settingsTitle });

    new Setting(containerEl)
      .setName(t.language)
      .setDesc(t.languageDesc)
      .addDropdown((dropdown) => {
        for (const id of LOCALES) {
          dropdown.addOption(id, t.localeName[id]);
        }
        dropdown.setValue(this.plugin.settings.locale);
        dropdown.onChange(async (value) => {
          this.plugin.settings.locale = value;
          await this.plugin.saveSettings();
          this.display();
          this.plugin.refreshViews(); // 语言同时作用于仪表盘正文
        });
      });

    new Setting(containerEl)
      .setName(t.appearance)
      .setDesc(t.appearanceDesc)
      .addDropdown((dropdown) => {
        for (const id of APPEARANCE_IDS) {
          dropdown.addOption(id, t.appearanceNames[id]);
        }
        dropdown.setValue(this.plugin.settings.appearance);
        dropdown.onChange(async (value) => {
          this.plugin.settings.appearance = value;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        });
      });

    containerEl.createEl("h3", { text: t.dataSourceTitle });

    new Setting(containerEl)
      .setName(t.dataSourceName)
      .setDesc(t.dataSourceDesc)
      .addDropdown((dropdown) => {
        dropdown.addOption("noteActivity", t.dataSourceNoteActivity);
        dropdown.addOption("changelog", t.dataSourceChangelog);
        dropdown.setValue(this.plugin.settings.dataSource);
        dropdown.onChange(async (value) => {
          this.plugin.settings.dataSource = value;
          await this.plugin.saveSettings();
          this.plugin.reloadViews();
          this.display();
        });
      });

    if (this.plugin.settings.dataSource === "noteActivity") {
      new Setting(containerEl)
        .setName(t.activityDateFieldName)
        .setDesc(t.activityDateFieldDesc)
        .addText((text) => {
          text
            .setPlaceholder("updated")
            .setValue(this.plugin.settings.activityDateField)
            .onChange(async (value) => {
              this.plugin.settings.activityDateField = value.trim() || "updated";
              await this.plugin.saveSettings();
              this.plugin.reloadViews();
            });
        });
      new Setting(containerEl)
        .setName(t.useMtimeName)
        .setDesc(t.useMtimeDesc)
        .addToggle((toggle) => {
          toggle.setValue(this.plugin.settings.useMtime).onChange(async (value) => {
            this.plugin.settings.useMtime = value;
            await this.plugin.saveSettings();
            this.plugin.reloadViews();
          });
        });
    }

    if (this.plugin.settings.dataSource === "changelog") {
      new Setting(containerEl)
        .setName(t.changelogPathsName)
        .setDesc(t.changelogPathsDesc)
        .addTextArea((area) => {
          area.setValue(this.plugin.settings.changelogPaths.join("\n")).onChange(async (value) => {
            this.plugin.settings.changelogPaths = value
              .split("\n")
              .map((p) => p.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
            this.plugin.reloadViews();
          });
        });
    }

    // 排除路径对两种数据源都生效，故置于 changelog 专属设置之外
    new Setting(containerEl)
      .setName(t.excludedPrefixesName)
      .setDesc(t.excludedPrefixesDesc)
      .addTextArea((area) => {
        area.setValue(this.plugin.settings.excludedPrefixes.join("\n")).onChange(async (value) => {
          this.plugin.settings.excludedPrefixes = value
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean);
          await this.plugin.saveSettings();
          this.plugin.reloadViews();
        });
      });

    containerEl.createEl("h3", { text: t.factoryTitle });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: t.factoryDesc,
    });

    const tabs = this.plugin.settings.factoryTabs;
    while (tabs.length < FACTORY_SLOT_COUNT) tabs.push({ folder: "", label: "" });

    for (let i = 0; i < FACTORY_SLOT_COUNT; i++) {
      this.renderFactorySlotSetting(containerEl, i, t);
    }
  }

  renderFactorySlotSetting(containerEl, index, t) {
    const slot = this.plugin.settings.factoryTabs[index];
    const wrap = containerEl.createDiv({ cls: "vdash-setting-slot" });

    const row = wrap.createDiv({ cls: "vdash-setting-slot-row" });
    row.createDiv({ cls: "vdash-setting-slot-name", text: t.slotName(index + 1) });

    const folderInput = row.createEl("input", { type: "text", cls: "vdash-setting-input-folder" });
    folderInput.placeholder = t.folderPlaceholder;
    folderInput.value = slot.folder;
    folderInput.addEventListener("input", async () => {
      slot.folder = folderInput.value;
      await this.plugin.saveSettings();
      this.updateFolderStatus(status, folderInput.value, t);
      this.plugin.refreshViews();
    });

    const labelInput = row.createEl("input", { type: "text", cls: "vdash-setting-input-label" });
    labelInput.placeholder = t.labelPlaceholder;
    labelInput.value = slot.label;
    labelInput.addEventListener("input", async () => {
      slot.label = labelInput.value;
      await this.plugin.saveSettings();
      this.plugin.refreshViews();
    });

    // 提示文字放第二个输入框正下方、左对齐，不占用右侧空间影响整行排版
    const statusRow = wrap.createDiv({ cls: "vdash-setting-slot-status-row" });
    const status = statusRow.createDiv({ cls: "vdash-setting-slot-status" });
    this.updateFolderStatus(status, slot.folder, t);
  }

  /** 文件夹路径实时校验：留空不提示，填了但库内找不到就给警示，避免用户以为已生效 */
  updateFolderStatus(statusEl, path, t) {
    const trimmed = (path || "").trim();
    statusEl.empty();
    if (!trimmed) return;
    const found = this.app.vault.getAbstractFileByPath(trimmed);
    if (found instanceof TFolder) {
      statusEl.setText(t.statusFound);
      statusEl.style.color = "var(--text-success)";
    } else {
      statusEl.setText(t.statusNotFound);
      statusEl.style.color = "var(--text-error)";
    }
  }
}

module.exports = class VaultDashboardPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new DashboardView(leaf, this));
    this.addSettingTab(new VaultDashboardSettingTab(this.app, this));

    this.addRibbonIcon("layout-dashboard", "Open Vault Dashboard X", () => this.activateView());
    this.addCommand({
      id: "open-vault-dashboard-x",
      name: "Open dashboard",
      callback: () => this.activateView(),
    });
  }

  /** 按当前设置返回数据源 provider（无状态、每次新建，开销可忽略）。 */
  getProvider() {
    return this.settings.dataSource === "changelog"
      ? new ChangelogProvider(this.settings)
      : new NoteActivityProvider(this.settings);
  }

  async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
    const migrated = this.settings.appearance === "universal";
    if (migrated) this.settings.appearance = "y2k";
    if (!APPEARANCE_IDS.includes(this.settings.appearance)) {
      this.settings.appearance = DEFAULT_SETTINGS.appearance;
    }
    // 旧版仅设置页有 settingsLocale（默认 zh-Hans）；现统一为 locale（默认英文）并做迁移。
    if (saved && typeof saved.locale !== "string" && typeof saved.settingsLocale === "string") {
      this.settings.locale = saved.settingsLocale;
    }
    if (!LOCALES.includes(this.settings.locale)) {
      this.settings.locale = DEFAULT_LOCALE;
    }
    delete this.settings.settingsLocale;

    // 老存档（provider 出现前）没有 dataSource 字段：此前一直在用迭代日志，迁移过去保持行为不变。
    // 必须限定「确实存在存档」——全新安装 loadData() 返回 null，不能被误判成老存档，
    // 否则新用户一装就落到 changelog 模式、又没有日志路径可读，看到的是一张空图。
    if (saved && typeof saved.dataSource !== "string") {
      this.settings.dataSource = "changelog";
    }
    if (!DATA_SOURCES.includes(this.settings.dataSource)) {
      this.settings.dataSource = DEFAULT_SETTINGS.dataSource;
    }
    // 活跃日期字段：留空回退到 updated
    if (typeof this.settings.activityDateField !== "string" || !this.settings.activityDateField.trim()) {
      this.settings.activityDateField = "updated";
    }
    this.settings.useMtime = !!this.settings.useMtime;
    // changelogPaths 深拷贝，避免复用 DEFAULT_SETTINGS 里的数组引用
    if (!Array.isArray(this.settings.changelogPaths)) {
      this.settings.changelogPaths = DEFAULT_CHANGELOG_PATHS.slice();
    } else {
      this.settings.changelogPaths = this.settings.changelogPaths.filter((p) => typeof p === "string");
    }

    // 深拷贝并校验内容工厂板块结构：避免复用 DEFAULT_SETTINGS 的数组引用（原地修改会污染默认值），
    // 也兜住存档里数组过短、条目缺字段或类型不对的情况。
    const savedTabs = Array.isArray(saved?.factoryTabs) ? saved.factoryTabs : DEFAULT_SETTINGS.factoryTabs;
    const normalized = [];
    for (let i = 0; i < FACTORY_SLOT_COUNT; i++) {
      const raw = savedTabs[i];
      normalized.push({
        folder: typeof raw?.folder === "string" ? raw.folder : "",
        label: typeof raw?.label === "string" ? raw.label : "",
      });
    }
    this.settings.factoryTabs = normalized;

    if (migrated) await this.saveData(this.settings);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      if (leaf.view instanceof DashboardView) leaf.view.render();
    }
  }

  /** 让所有打开的视图失效计数缓存并重算（数据源、活跃日期字段、mtime 开关、迭代日志路径变更时用）。 */
  reloadViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      if (leaf.view instanceof DashboardView) leaf.view.invalidate();
    }
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];

    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
};

/**
 * 测试/校验用导出：把纯函数与 provider 暴露给 test/harness.js（stub 掉 obsidian 后 require）。
 * 不影响 Obsidian 运行时——它只关心 module.exports 的默认导出（插件类）。
 */
module.exports._internal = {
  parseIterationLog,
  mergeCounts,
  noteActivityDay,
  ymdFromValue,
  buildLevelScale,
  buildFolderTree,
  NoteActivityProvider,
  ChangelogProvider,
  DEFAULT_CHANGELOG_PATHS,
};
/* nosourcemap */
