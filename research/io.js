import { emptyStudy, cleanDoi, unique, normalTitle } from "./options.js";

export async function studyId(s) {
  const text = cleanDoi(s.doi) || s.pmid || normalTitle(s.original || s.title);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return (
    "paper-" +
    Array.from(new Uint8Array(digest).slice(0, 15), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("")
  );
}
export function parseImports(input, db) {
  const text = input.replace(/^\uFEFF/, "").trim();
  if (!text) return [];
  if (text[0] === "{" || text[0] === "[") {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("JSON 格式无效。");
    }
    const records = Array.isArray(data) ? data : data.studies;
    if (!Array.isArray(records))
      throw new Error("请导入本站导出的完整文献 JSON。");
    return records.map((r) => {
      const item = { ...emptyStudy(), ...r };
      if (
        typeof item.title !== "string" ||
        !item.title.trim() ||
        ![
          "sources",
          "arms",
          "measures",
          "links",
          "modes",
          "tasks",
          "reported",
        ].every((k) => Array.isArray(item[k]))
      )
        throw new Error("JSON 中含有不完整的文献记录。");
      return {
        ...item,
        id: "",
        sources: item.sources.length ? item.sources : [db],
      };
    });
  }
  let entries = [],
    tags = {},
    last = "";
  const finish = () => {
    if (Object.keys(tags).length) entries.push(tags);
    tags = {};
    last = "";
  };
  for (const line of text.split(/\r?\n/)) {
    const m =
      line.match(/^([A-Z][A-Z0-9]{1,3})\s*-\s?(.*)$/) ||
      line.match(/^(%[A-Za-z0-9@])\s+(.*)$/) ||
      line.match(/^(RT|T1|A1|JF|YR|DO|UL|JO|FD|LK)\s+(.*)$/);
    if (!m) {
      if (last && line.trim() && /^\s+/.test(line))
        tags[last][tags[last].length - 1] += " " + line.trim();
      continue;
    }
    const k = m[1];
    if (k === "TY" || k === "PMID" || k === "%0" || k === "RT") {
      finish();
    }
    if (k === "ER") {
      finish();
      continue;
    }
    (tags[k] ||= []).push(m[2].trim());
    last = k;
  }
  finish();
  return entries
    .map((t) => {
      const first = (...keys) => keys.flatMap((k) => t[k] || [])[0] || "";
      const title = first("TI", "T1", "%T");
      if (!title) return null;
      const aid = [...(t.AID || []), ...(t.LID || [])].find((v) =>
        v.includes("[doi]"),
      );
      const doi = cleanDoi(
        first("DO", "%R") || aid?.replace(/\s*\[doi\]/, "") || "",
      );
      const url = first("UR", "UL", "LK", "%U");
      const pts = t.PT || [];
      const isRCT = pts.some((v) =>
        /^randomi[sz]ed controlled trial$/i.test(v),
      );
      return {
        ...emptyStudy(),
        title,
        doi,
        pmid: first("PMID"),
        authors: (t.FAU || t.AU || t.A1 || t["%A"] || []).join(", "),
        journal: first("JT", "JO", "JF", "T2", "TA", "%J"),
        year: first("PY", "Y1", "DP", "YR", "%D").match(/\d{4}/)?.[0] || "",
        sources: [db],
        links: url ? [{ name: "原题录", url }] : [],
        rct: isRCT ? "是" : "待核实",
        design: isRCT ? "随机对照试验" : "待核实",
      };
    })
    .filter(Boolean);
}
export function download(name, content, type) {
  const u = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function exportRecords(records, format) {
  const date = new Date().toLocaleDateString("sv-SE");
  if (format === "json") {
    download(
      "糖动研库-" + date + ".json",
      JSON.stringify({ format: "GlucoAtlas 1", studies: records }, null, 2),
      "application/json",
    );
    return;
  }
  const header = [
    "研究ID",
    "中文或显示题名",
    "原文题名",
    "作者",
    "期刊",
    "年",
    "DOI",
    "PMID",
    "来源",
    "全文状态",
    "PDF",
    "研究设计",
    "RCT",
    "人群",
    "运动类型",
    "干预周数",
    "原文干预时长",
    "周剂量说明",
    "组别",
    "组别角色",
    "有氧分钟/周",
    "抗阻分钟/周",
    "合计分钟/周",
    "随机人数",
    "组分析人数",
    "结局",
    "时间点",
    "原文时间",
    "方法",
    "单位",
    "结果n",
    "均值",
    "离散类型",
    "SD或SE",
    "CI下限",
    "CI上限",
    "原文定位",
    "报告结局",
    "数据可提取性",
    "偏倚风险",
    "偏倚依据",
    "Meta资格",
    "纳排理由",
    "任务",
    "笔记",
    "全文页",
    "题录链接",
  ];
  const rows = [];
  for (const s of records) {
    const out = [
      ...s.measures,
      ...s.arms
        .filter((a) => !s.measures.some((m) => m.arm === a.id))
        .map((a) => ({ arm: a.id })),
    ];
    if (!out.length) out.push({});
    for (const m of out) {
      const a = s.arms.find((a) => a.id === m.arm) || {};
      rows.push([
        s.id,
        s.title,
        s.original,
        s.authors,
        s.journal,
        s.year,
        s.doi,
        s.pmid,
        s.sources.join(" | "),
        s.access,
        s.pdf,
        s.design,
        s.rct,
        s.population,
        s.modes.join(" | "),
        s.weeks,
        s.duration,
        s.doseNote,
        a.name,
        a.role,
        a.aero,
        a.res,
        a.total,
        a.randomized,
        a.analyzed,
        m.outcome,
        m.stage,
        m.point,
        m.method,
        m.unit,
        m.n,
        m.mean,
        m.stat,
        m.spread,
        m.low,
        m.high,
        m.source,
        s.reported.join(" | "),
        s.raw,
        s.risk,
        s.riskNote,
        s.meta,
        s.reason,
        s.tasks.join(" | "),
        s.note,
        s.fulltext,
        s.links.map((l) => l.url).join(" | "),
      ]);
    }
  }
  const cell = (x) => {
    let s = String(x ?? "");
    if (/^[=+@\t\r]/.test(s) || /^-[^\d.]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  download(
    "糖动研库-提取长表-" + date + ".csv",
    "\uFEFF" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
}
export function pubmedRecord(d) {
  const rct = (d.types || []).some((v) =>
    /^randomi[sz]ed controlled trial$/i.test(v),
  );
  const review = (d.types || []).some((v) =>
    /systematic review|meta-analysis/i.test(v),
  );
  return {
    ...emptyStudy(),
    title: d.title,
    original: d.title,
    authors: d.authors,
    journal: d.journal,
    year: d.year,
    pmid: d.pmid,
    doi: d.doi,
    sources: ["PubMed"],
    rct: rct ? "是" : review ? "否" : "待核实",
    design: rct ? "随机对照试验" : review ? "系统综述 / Meta分析" : "待核实",
    access: d.pmc ? "公开全文" : "待核实",
    fulltext: d.pmc ? `https://pmc.ncbi.nlm.nih.gov/articles/${d.pmc}/` : "",
    links: [
      {
        name: "PubMed 题录",
        url: `https://pubmed.ncbi.nlm.nih.gov/${d.pmid}/`,
      },
    ],
  };
}
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.opacity = "0";
    document.body.append(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}
