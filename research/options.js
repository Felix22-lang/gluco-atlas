export const databases = [
  {
    id: "PubMed",
    name: "PubMed",
    short: "PM",
    color: "#388891",
    tint: "#e5f3f2",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    hint: "支持站内检索和逐篇入库，也可在 PubMed 官网运行同一检索式。",
  },
  {
    id: "中国知网",
    name: "中国知网",
    short: "CN",
    color: "#4678a6",
    tint: "#eaf0f8",
    url: "https://kns.cnki.net/kns8s/AdvSearch",
    hint: "打开高级检索，以主题字段逐行添加人群和运动词组，组间选 AND。可从结果页导出题录。",
  },
  {
    id: "万方",
    name: "万方",
    short: "WF",
    color: "#b77740",
    tint: "#fbefdf",
    url: "https://www.wanfangdata.com.cn/",
    hint: "在万方高级检索中按主题添加两组词，组内选 OR，组间选 AND。",
  },
  {
    id: "维普",
    name: "维普",
    short: "VP",
    color: "#8871a4",
    tint: "#f1edf7",
    url: "https://www.cqvip.com/advancesearch",
    hint: "在维普高级检索中输入布尔检索式，可按题名或关键词缩小范围。",
  },
  {
    id: "Web of Science",
    name: "Web of Science",
    short: "WS",
    color: "#5d819a",
    tint: "#e9f0f4",
    url: "https://www.webofscience.com/wos/woscc/advanced-search",
    hint: "选择 Web of Science 核心合集，在高级检索中粘贴 TS 主题检索式。入口可能需要学校订阅。",
  },
  {
    id: "Cochrane Library",
    name: "Cochrane Library",
    short: "CL",
    color: "#8e5778",
    tint: "#f6ebf0",
    url: "https://www.cochranelibrary.com/advanced-search/search-manager",
    hint: "在 Search Manager 中运行检索式。选择 Trials 查找 CENTRAL 试验记录，选择 Reviews 查找综述。",
  },
  {
    id: "SPORTDiscus",
    name: "SPORTDiscus",
    short: "SD",
    color: "#548364",
    tint: "#ebf3e8",
    url: "https://research.ebsco.com/",
    hint: "通过学校的 EBSCOhost 入口选择 SPORTDiscus，在高级检索中使用布尔检索式。",
  },
];
export const designs = [
  "随机对照试验",
  "非随机对照研究",
  "单组前后对照",
  "队列研究",
  "横断面研究",
  "系统综述 / Meta分析",
  "研究方案",
  "其他",
  "待核实",
];
export const modes = [
  "联合训练",
  "有氧训练",
  "抗阻训练",
  "HIIT",
  "步行",
  "传统身心运动",
  "其他运动",
];
export const accessTypes = ["公开 PDF", "公开全文", "需权限", "待核实"];
export const rawTypes = ["可提取", "待核实", "无法提取"];
export const metaTypes = ["待评估", "可用于Meta分析", "排除"];
export const risks = ["待评估", "低风险", "有些担忧", "高风险", "不适用"];
export const tasks = ["待下载全文", "待提取原始数据"];
export const outcomes = ["HbA1c", "FBG", "2hPG", "胰岛素敏感性", "胰岛素抵抗"];
export const stages = ["基线", "终点", "变化量"];
export const termGroups = [
  ["exerciseZh", "中文运动关键词", "中"],
  ["exerciseEn", "英文运动关键词", "EN"],
  ["glucoseZh", "中文血糖关键词", "中"],
  ["glucoseEn", "英文血糖关键词", "EN"],
  ["designZh", "研究设计限定词", "中"],
];
export const emptyStudy = () => ({
  id: "",
  title: "",
  original: "",
  authors: "",
  journal: "",
  year: "",
  doi: "",
  pmid: "",
  sources: [],
  links: [],
  pdf: "",
  fulltext: "",
  access: "待核实",
  design: "待核实",
  rct: "待核实",
  population: "待核实",
  sample: "",
  modes: [],
  weeks: "",
  duration: "",
  doseNote: "",
  arms: [],
  reported: [],
  measures: [],
  raw: "待核实",
  risk: "待评估",
  riskNote: "",
  meta: "待评估",
  reason: "",
  tasks: ["待下载全文", "待提取原始数据"],
  note: "",
  star: false,
});
export const newArm = () => ({
  id: crypto.randomUUID(),
  name: "",
  role: "干预",
  aero: "",
  res: "",
  total: "",
  randomized: "",
  analyzed: "",
});
export const newMeasure = () => ({
  arm: "",
  outcome: "HbA1c",
  stage: "终点",
  point: "",
  method: "",
  unit: "%",
  n: "",
  mean: "",
  stat: "SD",
  spread: "",
  low: "",
  high: "",
  source: "",
});
export function safeUrl(value) {
  try {
    const u = new URL(value);
    return /^(https?:)$/.test(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
export function known(value) {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value))
  );
}
export function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}
export const cleanDoi = (s) =>
  (s || "")
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase();
export const normalTitle = (s) =>
  (s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
export function sameStudy(a, b) {
  return !!(
    (a.pmid && b.pmid && String(a.pmid) === String(b.pmid)) ||
    (cleanDoi(a.doi) && cleanDoi(a.doi) === cleanDoi(b.doi)) ||
    [a.title, a.original].some(
      (t) =>
        normalTitle(t) &&
        [b.title, b.original].some((v) => normalTitle(t) === normalTitle(v)),
    )
  );
}
export const publicPdf = (s) => s.access === "公开 PDF" && !!safeUrl(s.pdf);
export const eligibleRaw = (s) => s.rct === "是" && s.raw === "可提取";
export const priority = (s) =>
  (publicPdf(s) ? 4 : 0) +
  (eligibleRaw(s) ? 3 : 0) +
  (s.meta === "可用于Meta分析" ? 1 : 0) +
  (s.modes.includes("联合训练") &&
  s.arms.some((a) => Number(a.aero) > 0 && Number(a.res) > 0)
    ? 0.5
    : 0);
export function issue(s) {
  if (typeof s.title !== "string" || !s.title.trim()) return "请填写研究题名。";
  if (!s.sources.length) return "请选择至少一个题录来源。";
  if (s.access === "公开 PDF" && !safeUrl(s.pdf))
    return "请填写公开 PDF 的完整链接。";
  if (
    [s.pdf, s.fulltext, ...s.links.map((l) => l.url)].some(
      (u) => u && !safeUrl(u),
    )
  )
    return "资源链接需要使用完整的 http 或 https 地址。";
  if (s.arms.some((a) => typeof a.name !== "string" || !a.name.trim()))
    return "请为每个研究组填写组名。";
  if (
    s.arms.some((a) => !a.id) ||
    new Set(s.arms.map((a) => a.id)).size !== s.arms.length
  )
    return "研究组标识缺失或重复。";
  if (s.measures.some((m) => !s.arms.some((a) => a.id === m.arm)))
    return "请为每条结果指定有效的研究组别。";
  const quantities = [
    s.weeks,
    ...s.arms.flatMap((a) => [a.aero, a.res, a.total]),
  ];
  if (quantities.some((v) => v !== "" && v != null && (!known(v) || +v < 0)))
    return "干预周数和训练分钟数须为非负数。";
  const counts = [
    s.sample,
    ...s.arms.flatMap((a) => [a.randomized, a.analyzed]),
    ...s.measures.map((m) => m.n),
  ];
  if (
    counts.some(
      (v) => v !== "" && v != null && (!Number.isInteger(+v) || +v < 1),
    )
  )
    return "样本量须为正整数，尚未报告时请留空。";
  if (s.measures.some((m) => !known(m.mean) || !String(m.unit || "").trim()))
    return "结局数据需要有均值和单位。";
  if (
    s.measures.some(
      (m) =>
        m.stat === "95% CI" &&
        (!known(m.low) || !known(m.high) || +m.low > +m.high),
    )
  )
    return "请核对置信区间上下限。";
  if (
    s.measures.some(
      (m) => ["SD", "SE"].includes(m.stat) && known(m.spread) && +m.spread < 0,
    )
  )
    return "SD 或 SE 须为非负数。";
  return "";
}
export const blankFilters = () => ({
  full: "",
  design: "",
  rct: "",
  mode: "",
  raw: "",
  risk: "",
  meta: "",
  status: "",
  population: "",
  reported: [],
  aeroMin: "",
  aeroMax: "",
  resMin: "",
  resMax: "",
  weeksMin: "",
  weeksMax: "",
  periodBasis: "按原文周数",
  stage: "终点",
  insMethod: "",
  insUnit: "",
  HbA1cMin: "",
  HbA1cMax: "",
  FBGMin: "",
  FBGMax: "",
  "2hPGMin": "",
  "2hPGMax": "",
  胰岛素敏感性Min: "",
  胰岛素敏感性Max: "",
});
const numericTest = (v, min, max) =>
  (!known(min) && !known(max)) ||
  (known(v) &&
    (!known(min) || Number(v) >= Number(min)) &&
    (!known(max) || Number(v) <= Number(max)));
export const researchArms = (s) => s.arms.filter((a) => a.role !== "对照");
export function studyWeeks(study, filters) {
  if (known(study.weeks)) return Number(study.weeks);
  if (filters.periodBasis === "月数按平均周数换算") {
    const match = String(study.duration || "")
      .trim()
      .match(/^(\d+(?:\.\d+)?)\s*(?:个)?月$/);
    if (match) return (Number(match[1]) * 365.25) / 84;
  }
  return null;
}
function armMatches(a, f) {
  return (
    numericTest(a.aero, f.aeroMin, f.aeroMax) &&
    numericTest(a.res, f.resMin, f.resMax)
  );
}
export function measureValues(s, key, f) {
  const armIds = researchArms(s)
    .filter((a) => armMatches(a, f))
    .map((a) => a.id);
  return s.measures
    .filter(
      (m) =>
        m.outcome === key &&
        m.stage === f.stage &&
        armIds.includes(m.arm) &&
        known(m.mean),
    )
    .map((m) => {
      if (key === "胰岛素敏感性")
        return f.insMethod &&
          f.insUnit &&
          m.method.trim().toLowerCase() === f.insMethod.trim().toLowerCase() &&
          m.unit.trim().toLowerCase() === f.insUnit.trim().toLowerCase()
          ? +m.mean
          : null;
      if (key === "HbA1c") return m.unit === "%" ? +m.mean : null;
      return m.unit === "mmol/L"
        ? +m.mean
        : m.unit === "mg/dL"
          ? +m.mean / 18.0182
          : null;
    })
    .filter((v) => v !== null);
}
export function filterStudy(s, f) {
  const eq = {
    full: "access",
    design: "design",
    rct: "rct",
    raw: "raw",
    risk: "risk",
    meta: "meta",
    population: "population",
  };
  if (Object.entries(eq).some(([k, p]) => f[k] && s[p] !== f[k])) return false;
  if (f.mode && !s.modes.includes(f.mode)) return false;
  if (
    f.status === "任一待办"
      ? !s.tasks.length
      : f.status && !s.tasks.includes(f.status) && s.meta !== f.status
  )
    return false;
  if (f.reported.some((k) => !s.reported.includes(k))) return false;
  if (!numericTest(studyWeeks(s, f), f.weeksMin, f.weeksMax)) return false;
  if (
    [f.aeroMin, f.aeroMax, f.resMin, f.resMax].some(known) &&
    !researchArms(s).some((a) => armMatches(a, f))
  )
    return false;
  return outcomes.slice(0, 4).every((k) => {
    const min = f[k + "Min"],
      max = f[k + "Max"];
    return (
      (!known(min) && !known(max)) ||
      measureValues(s, k, f).some((v) => numericTest(v, min, max))
    );
  });
}
export const sortFields = [
  ["priority", "优先级"],
  ["year", "发表年份"],
  ["title", "研究题名"],
  ["access", "全文获取"],
  ["design", "研究设计"],
  ["rct", "是否 RCT"],
  ["mode", "运动类型"],
  ["aero", "每周有氧分钟"],
  ["res", "每周抗阻分钟"],
  ["weeks", "干预周数"],
  ...outcomes.slice(0, 4).map((k) => [k, k + " 数值"]),
  ["risk", "偏倚风险"],
  ["meta", "Meta 纳入资格"],
  ["raw", "RCT 数据可提取性"],
];
export function sortValue(s, key, f) {
  if (key === "priority") return priority(s);
  if (key === "mode") return s.modes.join("、") || null;
  if (key === "weeks") return studyWeeks(s, f);
  if (key === "rct") return { 否: 0, 是: 1 }[s.rct] ?? null;
  if (key === "year") return known(s[key]) ? +s[key] : null;
  if (key === "aero" || key === "res") {
    const vals = researchArms(s)
      .filter((a) => armMatches(a, f) && known(a[key]))
      .map((a) => +a[key]);
    return vals.length ? Math.max(...vals) : null;
  }
  if (outcomes.includes(key)) {
    const v = measureValues(s, key, f);
    return v.length ? Math.max(...v) : null;
  }
  if (key === "risk")
    return { 低风险: 1, 有些担忧: 2, 高风险: 3 }[s.risk] ?? null;
  if (key === "meta") return { 排除: 0, 待评估: 1, 可用于Meta分析: 2 }[s.meta];
  if (key === "access")
    return { 待核实: 0, 需权限: 1, 公开全文: 2, "公开 PDF": 3 }[s.access];
  if (key === "raw") return { 待核实: 0, 无法提取: 1, 可提取: 2 }[s.raw];
  return s[key] || null;
}
export function sortStudies(arr, key, dir, f) {
  return [...arr].sort((a, b) => {
    const x = sortValue(a, key, f),
      y = sortValue(b, key, f);
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1;
    const c =
      typeof x === "number"
        ? x - y
        : String(x).localeCompare(String(y), "zh-CN");
    return (
      (dir === "asc" ? c : -c) ||
      (b.year || 0) - (a.year || 0) ||
      a.title.localeCompare(b.title, "zh-CN")
    );
  });
}
