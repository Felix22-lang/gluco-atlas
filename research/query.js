import orig from "#gluco-terms" with { type: "json" };
import { unique } from "./options.js";
export const presetLabels = {
  core: "核心主题",
  combined: "联合训练与 HbA1c",
  all: "完整关键词框架",
};
export function buildQuery(db, preset, extensions, rct, designLimit = false) {
  const zh = ["中国知网", "万方", "维普"].includes(db),
    lang = zh ? "Zh" : "En";
  const all = (k) => unique([...(orig[k] || []), ...(extensions[k] || [])]);
  const bool = (items) =>
    "(" +
    unique(items)
      .map((t) => (zh ? t : '"' + t.replaceAll('"', "") + '"'))
      .join(" OR ") +
    ")";
  let groups = [];
  const disease = zh
    ? ["糖尿病", "糖尿病前期", "糖耐量受损", "空腹血糖受损"]
    : [
        "diabetes",
        "diabetes mellitus",
        "type 2 diabetes",
        "prediabetes",
        "impaired glucose tolerance",
        "impaired fasting glucose",
      ];
  if (preset === "combined") {
    groups = [
      zh ? ["2型糖尿病", "2 型糖尿病"] : ["type 2 diabetes", "T2DM"],
      zh
        ? ["联合训练", "有氧联合抗阻", "有氧和抗阻训练"]
        : [
            "combined training",
            "concurrent training",
            "aerobic and resistance training",
          ],
      zh ? ["糖化血红蛋白", "HbA1c"] : ["glycated hemoglobin", "HbA1c"],
    ];
  } else if (preset === "all") {
    groups = [disease, all("exercise" + lang), all("glucose" + lang)];
  } else {
    groups = [
      disease,
      zh
        ? ["运动处方", "运动干预", "有氧运动", "抗阻训练", "身体活动"]
        : [
            "exercise prescription",
            "exercise intervention",
            "exercise training",
            "aerobic exercise",
            "resistance training",
            "physical activity",
          ],
    ];
  }
  if (zh && designLimit) groups.push(all("designZh"));
  if (rct) {
    groups.push(
      zh
        ? ["随机对照", "随机分组", "随机试验"]
        : ["randomized", "randomised", "randomly"],
    );
  }
  const text = groups.map(bool).join(" AND ");
  return db === "Web of Science" ? "TS=(" + text + ")" : text;
}
export function dbUrl(db, query) {
  if (db.id === "PubMed") return db.url + "?term=" + encodeURIComponent(query);
  return db.url;
}
