import { emptyStudy, newMeasure } from "./options.js";

const arm = (
  id,
  name,
  role,
  randomized = "",
  analyzed = "",
  aero = "",
  res = "",
  total = "",
) => ({ id, name, role, randomized, analyzed, aero, res, total });
function trial(fields) {
  const s = {
    ...emptyStudy(),
    design: "随机对照试验",
    rct: "是",
    sources: ["PubMed"],
    tasks: [],
    ...fields,
  };
  if (s.pmid)
    s.links = [
      ...s.links,
      {
        name: "PubMed 题录",
        url: `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/`,
      },
    ];
  return s;
}
function scores(arms, outcome, unit, source, stages, rows, method = "") {
  return rows.flatMap((values, index) =>
    stages.map((stage, i) => ({
      ...newMeasure(),
      arm: arms[index].id,
      n: arms[index].analyzed,
      outcome,
      unit,
      source,
      stage,
      mean: values[i][0],
      spread: values[i][1],
      method,
    })),
  );
}
const gArms = [
  arm("hi", "联合 HIIT", "干预", 23, "", 12, 24, 78),
  arm("mi", "中强度联合训练", "干预", 23, "", 150, 60, 210),
  arm("co", "等待名单", "对照", 23),
];
const luArms = [
  arm("ae", "有氧训练", "干预", "", 26, 150, 0, 150),
  arm("re", "抗阻训练", "干预", "", 23, 0, 150, 150),
  arm("co", "对照", "对照", "", 21),
];
const xuArms = [
  arm("ba", "八段锦", "干预", 20, 20, "", "", 90),
  arm("eq", "器械循环训练", "干预", 21, 21, "", "", 90),
  arm("co", "常规照护", "对照", 21, 21),
];
const liArms = [
  arm("ba", "八段锦", "干预", 40, 39, "", "", 300),
  arm("wa", "步行", "活性对照", 40, 37, 300, 0, 300),
];
const baArms = [
  arm("ae", "有氧训练", "干预", 20, 19, 180, 0, 180),
  arm("re", "抗阻训练", "干预", 20, 19, 0, 180, 180),
];
const amArms = [
  arm("ct", "有氧与抗阻联合训练", "干预", 30, 30),
  arm("hi", "HIIT", "干预", 30, 30),
  arm("co", "常规治疗", "对照", 30, 30),
];
const beforeAfter = ["基线", "终点"];
const clamp = "高胰岛素正常血糖钳夹";
const bcMeasures = [
  ["HbA1c", "%", [-0.4, -0.61, -0.18], [-0.35, -0.59, -0.1], ""],
  ["FBG", "mg/dL", [-15.2, -29.8, -0.57], [-12.0, -23.4, -0.5], ""],
  [
    "胰岛素敏感性",
    "mg/kg FFM/min",
    [1.15, 0.22, 2.07],
    [0.52, 0.01, 1.05],
    clamp,
  ],
].flatMap(([outcome, unit, ...rest]) =>
  baArms.map((a, i) => ({
    ...newMeasure(),
    arm: a.id,
    n: a.analyzed,
    outcome,
    unit,
    stage: "变化量",
    mean: rest[i][0],
    stat: "95% CI",
    low: rest[i][1],
    high: rest[i][2],
    method: rest[2],
    source: "表 2，4 个月。变化均值及 95% CI。",
  })),
);
const cochrane =
  "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD002968.pub2/full";
const cnki =
  "https://tjty.cbpt.cnki.net/portal/journal/portal/client/paper/b9376945fbc88ffe3a881093bc894ea6";
export const seeds = [
  trial({
    id: "gajanand-2024",
    title: "低容量有氧与抗阻联合间歇训练对 2 型糖尿病的影响",
    original:
      "Low-volume combined aerobic and resistance high-intensity interval training in type 2 diabetes: a randomised controlled trial",
    authors: "Gajanand T, Cox ER, Keating SE, et al.",
    journal: "BMJ Open Sport & Exercise Medicine",
    year: 2024,
    doi: "10.1136/bmjsem-2024-002046",
    pmid: "39381412",
    fulltext: "https://bmjopensem.bmj.com/content/10/4/e002046",
    pdf: "https://bmjopensem.bmj.com/content/bmjosem/10/4/e002046.full.pdf",
    access: "公开 PDF",
    population: "2 型糖尿病",
    sample: 69,
    modes: ["联合训练", "HIIT"],
    weeks: 8,
    arms: gArms,
    reported: ["HbA1c", "FBG", "2hPG", "胰岛素敏感性", "胰岛素抵抗"],
    raw: "可提取",
    tasks: ["待提取原始数据"],
    measures: scores(
      gArms,
      "HbA1c",
      "%",
      "表 2，8 周随机阶段。组内均值及 SD。",
      ["基线", "终点", "变化量"],
      [
        [
          [8.6, 2.2],
          [8.4, 2.0],
          [-0.2, 1.2],
        ],
        [
          [9.0, 1.8],
          [8.3, 1.9],
          [-0.7, 1.3],
        ],
        [
          [8.1, 1.3],
          [8.8, 1.5],
          [0.7, 0.8],
        ],
      ],
    ),
    doseNote:
      "中强度组每周有氧 150 分钟、抗阻 60 分钟。HIIT 的 12 与 24 分钟仅计高强度工作段，78 分钟含热身、恢复和放松。",
    note: "69 人随机分配。HbA1c 配对分析人数分别为 45、45、44，表中各臂分析人数留待核对。8 周后对照重新随机，勿把 12 个月随访合并进同一比较。",
  }),
  trial({
    id: "lingzhi-2026",
    title: "八段锦与器械循环训练对中老年糖尿病前期人群血糖的影响",
    original:
      "Comparison of Traditional Chinese Exercise and Equipment-Based Exercise on Glycaemic Control and Vitamin D Levels in Middle-Aged and Elderly Patients With Prediabetes: A Randomised Controlled Trial",
    authors: "Xu Lingzhi, Zhou Chunhua, Liu Wu, et al.",
    journal: "Endocrinology, Diabetes & Metabolism",
    year: 2026,
    doi: "10.1002/edm2.70326",
    pmid: "42709983",
    fulltext: "https://onlinelibrary.wiley.com/doi/10.1002/edm2.70326",
    pdf: "https://onlinelibrary.wiley.com/doi/pdf/10.1002/edm2.70326",
    access: "公开 PDF",
    population: "糖尿病前期",
    sample: 62,
    modes: ["传统身心运动", "联合训练"],
    weeks: 12,
    arms: xuArms,
    reported: ["HbA1c", "FBG", "2hPG"],
    raw: "可提取",
    doseNote:
      "两干预组每周 3 次，每次核心训练 30 分钟。器械组结合有氧与抗阻，未报告各自分钟数。",
    measures: [
      ...scores(xuArms, "HbA1c", "%", "表 3，12 周", beforeAfter, [
        [
          [6, 0.4],
          [5.6, 0.4],
        ],
        [
          [6.2, 0.4],
          [5.4, 0.4],
        ],
        [
          [6.1, 0.3],
          [6, 0.3],
        ],
      ]),
      ...scores(xuArms, "FBG", "mmol/L", "表 3，12 周（FPG）", beforeAfter, [
        [
          [6.4, 0.5],
          [5.8, 0.5],
        ],
        [
          [6.6, 0.5],
          [5.6, 0.5],
        ],
        [
          [6.5, 0.4],
          [6.4, 0.4],
        ],
      ]),
      ...scores(
        xuArms,
        "2hPG",
        "mmol/L",
        "表 3，12 周",
        beforeAfter,
        [
          [
            [9.6, 1.3],
            [8.2, 1.3],
          ],
          [
            [9.9, 1.4],
            [7.8, 1.2],
          ],
          [
            [9.8, 1.2],
            [9.5, 1.2],
          ],
        ],
        "OGTT",
      ),
    ],
  }),
  trial({
    id: "amaravadi-2025",
    title: "联合训练与高强度间歇训练对 2 型糖尿病血糖及胰岛素抵抗的影响",
    original:
      "Comparative effects of combined aerobic and resistance training versus high-intensity interval training on insulin resistance, glycaemic control, body composition and quality of life in type 2 diabetes: A 12-week randomised controlled trial",
    authors: "Amaravadi SK, Ferreira AS, Vigário PS",
    journal: "PLOS ONE",
    year: 2025,
    doi: "10.1371/journal.pone.0336898",
    pmid: "41370222",
    fulltext: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12694805/",
    pdf: "https://journals.plos.org/plosone/article/file?id=10.1371%2Fjournal.pone.0336898&type=printable",
    access: "公开 PDF",
    population: "2 型糖尿病",
    sample: 90,
    modes: ["联合训练", "HIIT"],
    weeks: 12,
    arms: amArms,
    reported: ["HbA1c", "FBG", "胰岛素抵抗"],
    raw: "可提取",
    tasks: ["待提取原始数据"],
    links: [
      {
        name: "作者列出的 OSF 数据仓库",
        url: "https://doi.org/10.17605/OSF.IO/4Q9XU",
      },
    ],
    doseNote: "每周训练 3–5 次。联合组有氧和抗阻的分项时长待核实。",
    note: "表 3 为模型估计边际均值及 SE。作者提供 OSF 数据仓库，文件内容待核验。",
    measures: [
      ...scores(
        amArms,
        "HbA1c",
        "%",
        "表 1",
        ["基线"],
        [[[8.5, 1.2]], [[9.4, 1.6]], [[7.8, 1.5]]],
      ),
      ...scores(
        amArms,
        "HbA1c",
        "%",
        "表 3，模型估计边际均值及 SE",
        ["变化量"],
        [[[-0.8, 0.5]], [[-0.7, 0.5]], [[-0.1, 0.4]]],
      ).map((r) => ({ ...r, stat: "SE" })),
      ...scores(
        amArms,
        "FBG",
        "mg/dL",
        "表 1",
        ["基线"],
        [[[152.3, 30.8]], [[180.9, 34.9]], [[126.9, 28.6]]],
      ),
    ],
  }),
  trial({
    id: "luo-2023",
    title: "抗阻与有氧运动对糖尿病前期人群糖代谢的影响",
    original:
      "Effect of resistance vs. aerobic exercise in pre-diabetes: an RCT",
    authors: "Luo X, Wang Z, Li B, Zhang X, Li X",
    journal: "Trials",
    year: 2023,
    doi: "10.1186/s13063-023-07116-3",
    pmid: "36788568",
    fulltext: "https://link.springer.com/article/10.1186/s13063-023-07116-3",
    pdf: "https://trialsjournal.biomedcentral.com/counter/pdf/10.1186/s13063-023-07116-3.pdf",
    access: "公开 PDF",
    population: "糖尿病前期",
    sample: 80,
    modes: ["有氧训练", "抗阻训练"],
    weeks: 12,
    arms: luArms,
    raw: "可提取",
    reported: ["FBG", "2hPG", "胰岛素抵抗"],
    doseNote: "两个运动组各每周 3 次、每次 50 分钟，为相互独立的试验组。",
    measures: [
      ...scores(luArms, "FBG", "mmol/L", "表 3，12 周", beforeAfter, [
        [
          [6.19, 0.6],
          [5.78, 0.4],
        ],
        [
          [6.09, 0.7],
          [5.78, 0.7],
        ],
        [
          [5.86, 0.6],
          [5.88, 0.6],
        ],
      ]),
      ...scores(
        luArms,
        "2hPG",
        "mmol/L",
        "表 3，12 周",
        beforeAfter,
        [
          [
            [9.05, 1.4],
            [7.07, 1.1],
          ],
          [
            [9.17, 1.7],
            [7.47, 1.1],
          ],
          [
            [8.6, 1.2],
            [7.73, 1.4],
          ],
        ],
        "OGTT",
      ),
      ...scores(
        luArms,
        "胰岛素抵抗",
        "指数",
        "表 3，12 周",
        beforeAfter,
        [
          [
            [1.97, 0.5],
            [1.72, 0.3],
          ],
          [
            [2.27, 0.6],
            [1.78, 0.3],
          ],
          [
            [1.84, 0.4],
            [1.89, 0.3],
          ],
        ],
        "HOMA2-IR",
      ),
    ],
  }),
  trial({
    id: "li-qin-2022",
    title: "八段锦对社区糖尿病前期患者干预作用的临床观察",
    original:
      "Clinical observation on intervention effect of Baduanjin on pre-diabetic patients in the community",
    authors: "李勤，吴瑞，王凡，石白，安然",
    journal: "上海中医药杂志",
    year: 2022,
    doi: "10.16305/j.1007-1334.2022.2103082",
    sources: ["期刊官网"],
    fulltext:
      "https://shzyyzz.shzyyzz.com/zh/article/doi/10.16305/j.1007-1334.2022.2103082/",
    pdf: "https://shzyyzz.shzyyzz.com/rc-pub/front/front-article/download/26164883/lowqualitypdf/八段锦对社区糖尿病前期患者干预作用的临床观察.pdf",
    access: "公开 PDF",
    population: "糖尿病前期",
    sample: 80,
    modes: ["传统身心运动", "步行"],
    weeks: 24,
    arms: liArms,
    reported: ["HbA1c", "FBG", "2hPG", "胰岛素抵抗"],
    raw: "可提取",
    doseNote:
      "两组均有生活方式指导。八段锦及步行各每周 300 分钟。表 2 报告完成者数据。",
    measures: [
      ...scores(liArms, "HbA1c", "%", "表 2，第 51 页，24 周", beforeAfter, [
        [
          [5.95, 0.37],
          [5.63, 0.31],
        ],
        [
          [5.99, 0.37],
          [5.87, 0.29],
        ],
      ]),
      ...scores(liArms, "FBG", "mmol/L", "表 2，第 51 页，24 周", beforeAfter, [
        [
          [6.51, 0.46],
          [5.93, 0.41],
        ],
        [
          [6.45, 0.41],
          [6.26, 0.37],
        ],
      ]),
      ...scores(
        liArms,
        "2hPG",
        "mmol/L",
        "表 2，第 51 页，24 周",
        beforeAfter,
        [
          [
            [9.65, 1.37],
            [8.73, 0.92],
          ],
          [
            [9.48, 1.36],
            [8.97, 1.02],
          ],
        ],
        "餐后 2 小时",
      ),
      ...scores(
        liArms,
        "胰岛素抵抗",
        "指数",
        "表 2，第 51 页，24 周",
        beforeAfter,
        [
          [
            [3.71, 0.31],
            [2.96, 0.26],
          ],
          [
            [3.69, 0.23],
            [3.45, 0.22],
          ],
        ],
        "HOMA-IR",
      ),
    ],
  }),
  trial({
    id: "bacchi-2012",
    title: "有氧与抗阻训练对 2 型糖尿病代谢指标的影响（RAED2）",
    original:
      "Metabolic effects of aerobic training and resistance training in type 2 diabetic subjects: a randomized controlled trial (the RAED2 study)",
    authors: "Bacchi E, Negri C, Zanolin ME, et al.",
    journal: "Diabetes Care",
    year: 2012,
    doi: "10.2337/dc11-1655",
    pmid: "22344613",
    fulltext: "https://doi.org/10.2337/dc11-1655",
    pdf: "https://diabetesjournals.org/care/article-pdf/35/4/676/611151/676.pdf",
    access: "公开 PDF",
    population: "2 型糖尿病",
    sample: 40,
    modes: ["有氧训练", "抗阻训练"],
    duration: "4 个月",
    arms: baArms,
    reported: ["HbA1c", "FBG", "胰岛素敏感性"],
    raw: "可提取",
    doseNote: "每组每周 3 次、每次 60 分钟。原文以月报告干预时长。",
    measures: bcMeasures,
  }),
  trial({
    id: "yuan-2020",
    title: "有氧和抗阻训练对糖尿病前期人群代谢控制及胰岛 β 细胞功能的影响",
    original:
      "Comparing the effects of 6 months aerobic exercise and resistance training on metabolic control and β-cell function in Chinese patients with prediabetes: A multicenter randomized controlled trial",
    authors: "Yuan X, Dai X, Liu L, et al.",
    journal: "Journal of Diabetes",
    year: 2020,
    doi: "10.1111/1753-0407.12955",
    pmid: "31141300",
    fulltext: "https://onlinelibrary.wiley.com/doi/10.1111/1753-0407.12955",
    pdf: "https://onlinelibrary.wiley.com/doi/pdf/10.1111/1753-0407.12955",
    access: "公开 PDF",
    population: "糖尿病前期",
    sample: 248,
    modes: ["有氧训练", "抗阻训练"],
    duration: "6 个月",
    arms: [
      arm("ae", "有氧训练", "干预", 83, "", 150, 0, 150),
      arm("re", "抗阻训练", "干预", 82, "", 0, 150, 150),
      arm("co", "常规对照", "对照", 83),
    ],
    reported: ["HbA1c", "FBG", "2hPG", "胰岛素抵抗"],
    tasks: ["待提取原始数据"],
    doseNote: "有氧为每周核心训练时间。抗阻约 150 分钟/周，前两周逐步增加。",
    note: "表 2 的部分结局采用平方根变换并报告 95% CI，原始量纲的 HbA1c 组别数据待提取。",
  }),
  trial({
    id: "li-qingwen-2020",
    title: "餐后有氧联合抗阻运动对糖耐量减低（IGT）人群干预效果研究",
    authors: "李庆雯，徐冬青，邵琦琦，元也",
    journal: "天津体育学院学报",
    year: 2020,
    doi: "10.13297/j.cnki.issn1005-0000.2020.03.011",
    sources: ["中国知网"],
    links: [{ name: "中国知网题录", url: cnki }],
    population: "糖尿病前期",
    sample: 60,
    modes: ["联合训练"],
    weeks: 12,
    arms: [
      arm("pre", "晚餐前训练", "干预", "", "", "", "", 150),
      arm("post", "晚餐后训练", "干预", "", "", "", "", 150),
    ],
    reported: ["HbA1c", "FBG", "2hPG", "胰岛素敏感性"],
    tasks: ["待下载全文", "待提取原始数据"],
    doseNote:
      "两组相同处方，每周 3 次、每次 50 分钟。分项分钟数及各组分析人数待核实。",
    note: "公开题录含前后测数值，± 的统计类型需对照全文。",
  }),
  trial({
    id: "church-2010",
    title: "有氧和抗阻训练对 2 型糖尿病患者 HbA1c 的影响（HART-D）",
    original:
      "Effects of aerobic and resistance training on hemoglobin A1c levels in patients with type 2 diabetes: a randomized controlled trial",
    authors: "Church TS, Blair SN, Cocreham S, et al.",
    journal: "JAMA",
    year: 2010,
    doi: "10.1001/jama.2010.1710",
    pmid: "21098771",
    fulltext: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3174102/",
    access: "公开全文",
    population: "2 型糖尿病",
    sample: 262,
    modes: ["有氧训练", "抗阻训练", "联合训练"],
    duration: "9 个月",
    reported: ["HbA1c"],
    tasks: ["待提取原始数据"],
    links: [
      {
        name: "期刊勘误",
        url: "https://jamanetwork.com/journals/jama/fullarticle/645865",
      },
    ],
    note: "提取前请结合期刊勘误核对数据。",
  }),
  trial({
    id: "sigal-2007",
    title: "有氧、抗阻及联合训练对 2 型糖尿病血糖控制的作用（DARE）",
    original:
      "Effects of aerobic training, resistance training, or both on glycemic control in type 2 diabetes: a randomized trial",
    authors: "Sigal RJ, Kenny GP, Boulé NG, et al.",
    journal: "Annals of Internal Medicine",
    year: 2007,
    doi: "10.7326/0003-4819-147-6-200709180-00005",
    pmid: "17876019",
    fulltext: "https://doi.org/10.7326/0003-4819-147-6-200709180-00005",
    access: "公开全文",
    population: "2 型糖尿病",
    sample: 251,
    modes: ["有氧训练", "抗阻训练", "联合训练"],
    weeks: 22,
    reported: ["HbA1c"],
    tasks: ["待提取原始数据"],
  }),
  trial({
    id: "umpierre-2011",
    title:
      "运动建议、结构化训练与 2 型糖尿病 HbA1c 的关系：系统综述与 Meta 分析",
    original:
      "Physical activity advice only or structured exercise training and association with HbA1c levels in type 2 diabetes: a systematic review and meta-analysis",
    authors: "Umpierre D, Ribeiro PAB, Kramer CK, et al.",
    journal: "JAMA",
    year: 2011,
    doi: "10.1001/jama.2011.576",
    pmid: "21540423",
    design: "系统综述 / Meta分析",
    rct: "否",
    raw: "无法提取",
    population: "2 型糖尿病",
    modes: ["有氧训练", "抗阻训练", "联合训练"],
    reported: ["HbA1c"],
    tasks: ["待下载全文"],
    meta: "排除",
    reason: "二次研究，可用于追溯原始 RCT。",
  }),
  trial({
    id: "thomas-2006",
    title: "运动干预 2 型糖尿病的效果：Cochrane 系统综述",
    original: "Exercise for type 2 diabetes mellitus",
    authors: "Thomas DE, Elliott EJ, Naughton GA",
    journal: "Cochrane Database of Systematic Reviews",
    year: 2006,
    doi: "10.1002/14651858.CD002968.pub2",
    pmid: "16855995",
    sources: ["Cochrane Library", "PubMed"],
    links: [{ name: "Cochrane Library 综述", url: cochrane }],
    fulltext: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8989410/",
    access: "公开全文",
    design: "系统综述 / Meta分析",
    rct: "否",
    raw: "无法提取",
    population: "2 型糖尿病",
    modes: ["有氧训练", "抗阻训练"],
    reported: ["HbA1c"],
    meta: "排除",
    reason: "二次研究，可用于追溯原始 RCT。",
  }),
];
seeds.push(
  trial({
    id: "pu-2025",
    title: "正念饮食察觉训练配合有氧-抗阻运动护理对2型糖尿病患者的影响",
    authors: "蒲丹丹",
    journal: "中国医学创新",
    year: 2025,
    sources: ["维普"],
    links: [
      {
        name: "维普期刊平台题录",
        url: "https://edt.cqvip.com/journal/zgyxcx/article/1284658515",
      },
    ],
    population: "2 型糖尿病",
    sample: 80,
    modes: ["联合训练"],
    weeks: 8,
    reported: ["FBG", "2hPG", "HbA1c"],
    arms: [
      arm("co", "常规护理", "对照", 40),
      arm("ct", "正念饮食与联合运动护理", "干预", 40),
    ],
    tasks: ["待下载全文", "待提取原始数据"],
    note: "干预同时包含正念饮食和运动。纳入前需核对方案是否允许复合干预。",
  }),
);
