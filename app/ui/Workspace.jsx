"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Database,
  Download,
  FileDown,
  FileText,
  FlaskConical,
  Globe,
  Layers,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
  Timer,
  X,
} from "lucide-react";
import { useLibrary } from "./useLibrary";
import { Filters } from "./Filters";
import { Keywords } from "./Keywords";
import { SearchCenter } from "./SearchCenter";
import { Intake, Exporter } from "./Intake";
import { Study } from "./Study";
import { SectionHead, StudyTags, Select, Empty } from "./shared";
import {
  databases,
  filterStudy,
  sortStudies,
  sortFields,
  blankFilters,
  publicPdf,
  eligibleRaw,
  known,
} from "../../research/options";
const nav = [
  ["library", "文献工作台", LayoutDashboard],
  ["search", "跨库检索", Search],
  ["keywords", "关键词框架", Tags],
];
const cnDate = (s = "") => s.slice(0, 4);
const tabs = [
  ["all", "全部文献"],
  ["pdf", "公开 PDF"],
  ["rct", "RCT 可提取"],
  ["star", "已收藏"],
];
const tagsTitle = {
  full: "全文",
  raw: "分组数据",
  rct: "RCT",
  design: "设计",
  population: "人群",
  mode: "运动",
  risk: "偏倚",
  meta: "Meta",
  status: "状态",
  reported: "结局",
  stage: "数值时间点",
  insMethod: "敏感性方法",
  insUnit: "敏感性单位",
  aero: "有氧",
  res: "抗阻",
  weeks: "周数",
  periodBasis: "周期口径",
};
function activeEntries(f) {
  return Object.entries(f).filter(([k, v]) =>
    Array.isArray(v)
      ? v.length
      : v !== "" &&
        !(k === "stage" && v === "终点") &&
        !(k === "periodBasis" && v === "按原文周数"),
  );
}
function miniBars(books) {
  const ranges = [
    [0, 2009],
    [2010, 2014],
    [2015, 2019],
    [2020, 2021],
    [2022, 2022],
    [2023, 2023],
    [2024, 2024],
    [2025, 2025],
    [2026, 9999],
  ];
  return ranges.map(
    ([a, b]) =>
      books.filter((s) => known(s.year) && +s.year >= a && +s.year <= b).length,
  );
}
function Stat({ title, books, Icon, color, onClick }) {
  const b = miniBars(books),
    max = Math.max(1, ...b);
  return (
    <button className={"stat " + color} onClick={onClick}>
      <div className="stat-icon">
        <Icon size={22} strokeWidth={1.7} />
      </div>
      <div className="stat-copy">
        <span>{title}</span>
        <div>
          <strong>{books.length}</strong>
          <small>篇</small>
        </div>
      </div>
      <div className="spark" aria-hidden="true" title="按发表年份分布">
        {b.map((v, i) => (
          <i
            key={i}
            style={{
              height: (v ? 5 + (15 * v) / max : 3) + "px",
              opacity: v ? 0.65 : 0.18,
            }}
          />
        ))}
      </div>
    </button>
  );
}
function Card({ s, onView, toggle, busy }) {
  const db = databases.find((d) => d.id === s.sources[0]);
  return (
    <article className="study-card">
      <div className="paper-head">
        <div className="paper-origin">
          <i style={{ background: db?.color || "#718881" }} />
          {s.sources[0] || "其他"}
          {s.sources.length > 1 && (
            <span title={s.sources.slice(1).join("、")}>
              +{s.sources.length - 1}
            </span>
          )}
          <em /> <span className="paper-year">{s.year || "年份待核实"}</span>
          {(known(s.weeks) || s.duration) && (
            <span className="paper-duration">
              <Timer size={11} />
              {known(s.weeks) ? s.weeks + " 周" : s.duration}
            </span>
          )}
        </div>
        <button
          className={"bookmark " + (s.star ? "saved" : "")}
          disabled={busy}
          aria-pressed={s.star}
          aria-label={s.star ? "取消收藏" : "收藏文献"}
          title={s.star ? "取消收藏" : "收藏文献"}
          onClick={() => toggle(s)}
        >
          <Bookmark size={18} fill={s.star ? "currentColor" : "none"} />
        </button>
      </div>
      <h3>
        <button onClick={() => onView(s, "overview")}>{s.title}</button>
      </h3>
      <div className="paper-byline">
        {[s.authors, s.journal].filter(Boolean).map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
      <div className="card-bottom">
        <StudyTags s={s} compact={false} />
        <button className="extract-link" onClick={() => onView(s, "data")}>
          数据提取
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
export default function Workspace() {
  const lib = useLibrary();
  const [page, setPage] = useState("library"),
    [source, setSource] = useState("全部来源"),
    [tab, setTab] = useState("all"),
    [q, setQ] = useState(""),
    [filters, setFilters] = useState(blankFilters),
    [sort, setSort] = useState("priority"),
    [direction, setDir] = useState("desc"),
    [num, setNum] = useState(1),
    [dialog, setDialog] = useState(null),
    [toast, setToast] = useState(""),
    [saving, setSaving] = useState(""),
    [searchPreset, setSearchPreset] = useState("core");
  const toastTimer = useRef(null),
    searchRef = useRef(null),
    listRef = useRef(null);
  const notify = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3600);
  };
  function navigate(id) {
    if (id !== "search") setSearchPreset("core");
    location.hash = id;
    setPage(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  useEffect(() => {
    const sync = () => {
      const k = location.hash.slice(1);
      setPage(nav.some(([id]) => id === k) ? k : "library");
      setDialog(null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    function shortcut(e) {
      if (
        e.key === "/" &&
        page === "library" &&
        !dialog &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName,
        )
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [page, dialog]);
  useEffect(() => {
    setNum(1);
  }, [q, source, tab, filters, sort, direction]);
  const studies = lib.studies;
  const relevant = useMemo(() => {
    const text = q.trim().toLowerCase();
    return studies.filter(
      (s) =>
        (source === "全部来源" || s.sources.includes(source)) &&
        (tab === "all" ||
          (tab === "pdf" && publicPdf(s)) ||
          (tab === "rct" && eligibleRaw(s)) ||
          (tab === "star" && s.star)) &&
        (!text ||
          [
            s.title,
            s.original,
            s.authors,
            s.journal,
            s.doi,
            s.pmid,
            s.year,
            s.population,
            ...s.modes,
            ...s.reported,
            ...s.sources,
          ]
            .join(" ")
            .toLowerCase()
            .includes(text)),
    );
  }, [q, source, tab, studies]);
  const filtered = useMemo(
    () =>
      sortStudies(
        relevant.filter((s) => filterStudy(s, filters)),
        sort,
        direction,
        filters,
      ),
    [relevant, filters, sort, direction],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 6)),
    p = Math.min(pages, num);
  const active = activeEntries(filters);
  const sourceList = useMemo(
    () => [
      ...databases,
      ...[...new Set(studies.flatMap((s) => s.sources))]
        .filter((id) => !databases.some((d) => d.id === id))
        .map((id) => ({
          id,
          name: id,
          short: "JR",
          color: "#718881",
          tint: "#eff2ed",
        })),
    ],
    [studies],
  );
  const showStudy = (s, section) => setDialog({ type: "study", s, section });
  const add = (db = "PubMed", mode = "manual") =>
    setDialog({ type: "intake", db, mode });
  async function toggle(s) {
    if (saving) return;
    setSaving(s.id);
    try {
      await lib.write(
        "study",
        s.id,
        { ...s, star: !s.star },
        lib.revOf("study", s.id),
      );
      notify(s.star ? "已取消收藏" : "已收藏文献");
    } catch (e) {
      notify(e.message);
    } finally {
      setSaving("");
    }
  }
  function reset() {
    setQ("");
    setFilters(blankFilters());
    setSource("全部来源");
    setTab("all");
    setNum(1);
  }
  function jump() {
    setTimeout(
      () =>
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      10,
    );
  }
  function focusSet(kind) {
    reset();
    if (["pdf", "rct"].includes(kind)) setTab(kind);
    if (kind === "todo") setFilters({ ...blankFilters(), status: "任一待办" });
    jump();
  }
  function quickStatus(status) {
    setTab("all");
    setQ("");
    setSource("全部来源");
    setFilters({ ...blankFilters(), status });
    jump();
  }
  const pager = (n) => {
    setNum(n);
    jump();
  };
  const allToSearch = () => {
    setSearchPreset("all");
    navigate("search");
  };
  return (
    <>
      <header className="topbar">
        <div className="top-inner">
          <a
            className="brand"
            href="#library"
            onClick={() => navigate("library")}
          >
            <img src="/favicon.svg" alt="" width="39" height="39" />
            <span>
              <b>糖动研库</b>
              <small>GLUCO ATLAS</small>
            </span>
          </a>
          <nav aria-label="主导航">
            {nav.map(([key, label, Icon]) => (
              <a
                href={"#" + key}
                key={key}
                className={key === page ? "active" : ""}
                aria-current={key === page ? "page" : undefined}
                onClick={() => navigate(key)}
              >
                <Icon size={16} />
                {label}
              </a>
            ))}
          </nav>
          <button className="btn primary add-main" onClick={() => add()}>
            <Plus size={17} />
            添加文献
          </button>
        </div>
      </header>
      <main className="site-shell">
        {lib.error && (
          <div className="notice error" role="alert">
            {lib.error}
            <button className="text-link" onClick={lib.refresh}>
              重新连接
            </button>
          </div>
        )}
        {page === "library" ? (
          <>
            <section className="hero">
              <div className="hero-art" aria-hidden="true" />
              <div className="hero-content">
                <div className="hero-kicker">
                  <span />
                  EVIDENCE WORKSPACE
                </div>
                <h1>运动与血糖文献工作台</h1>
                <p>追踪糖尿病与糖尿病前期的运动处方及干预研究</p>
                <button
                  className="hero-button"
                  onClick={() => navigate("search")}
                >
                  <Search size={15} />
                  检索新文献
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </section>
            <section className="stats" aria-label="研究库概览">
              <Stat
                title="已收录文献"
                Icon={LibraryBig}
                color="sage"
                books={studies}
                onClick={() => focusSet("all")}
              />
              <Stat
                title="公开 PDF"
                Icon={FileDown}
                color="aqua"
                books={studies.filter(publicPdf)}
                onClick={() => focusSet("pdf")}
              />
              <Stat
                title="可提取 RCT 数据"
                Icon={FlaskConical}
                color="lavender"
                books={studies.filter(eligibleRaw)}
                onClick={() => focusSet("rct")}
              />
              <Stat
                title="待处理文献"
                Icon={ClipboardList}
                color="amber"
                books={studies.filter((s) => s.tasks.length)}
                onClick={() => focusSet("todo")}
              />
            </section>
            <div className="desk-grid">
              <section className="records" ref={listRef}>
                <div className="records-heading">
                  <div>
                    <span className="heading-bar" />
                    <h2>研究文献</h2>
                    <span className="count-pill">{filtered.length}</span>
                  </div>
                  <label className="mobile-source">
                    <Database size={13} />
                    <Select
                      aria-label="筛选数据库来源"
                      value={source}
                      onChange={setSource}
                      options={["全部来源", ...sourceList.map((d) => d.id)]}
                    />
                  </label>
                  <button
                    className="btn export-btn small"
                    disabled={!filtered.length}
                    onClick={() => setDialog({ type: "export" })}
                  >
                    <Download size={15} />
                    导出结果
                  </button>
                </div>
                <div className="tools-row">
                  <div className="search-box">
                    <Search size={17} />
                    <input
                      ref={searchRef}
                      type="search"
                      aria-label="搜索库内文献"
                      placeholder="检索题名、作者、DOI 或关键词…"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                    {q ? (
                      <button
                        className="icon-btn"
                        aria-label="清除搜索"
                        onClick={() => setQ("")}
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <kbd>/</kbd>
                    )}
                  </div>
                  <button
                    className={
                      "btn filter-btn " + (active.length ? "filter-on" : "")
                    }
                    onClick={() => setDialog({ type: "filters" })}
                  >
                    <SlidersHorizontal size={16} />
                    筛选{active.length > 0 && <b>{active.length}</b>}
                  </button>
                </div>
                <div className="tabs-sort">
                  <div className="list-tabs">
                    {tabs.map(([key, label]) => (
                      <button
                        key={key}
                        className={tab === key ? "active" : ""}
                        onClick={() => setTab(key)}
                        aria-pressed={tab === key}
                      >
                        {key === "star" && <Bookmark size={13} />} {label}
                      </button>
                    ))}
                  </div>
                  <div className="sort-control">
                    <button
                      className="sort-order"
                      aria-label={
                        "切换为" + (direction === "desc" ? "升序" : "降序")
                      }
                      title={
                        direction === "desc"
                          ? "当前降序，点击切换"
                          : "当前升序，点击切换"
                      }
                      onClick={() =>
                        setDir(direction === "desc" ? "asc" : "desc")
                      }
                    >
                      {direction === "desc" ? (
                        <ArrowDown size={14} />
                      ) : (
                        <ArrowUp size={14} />
                      )}
                    </button>
                    <select
                      aria-label="排序字段"
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        if (
                          e.target.value === "胰岛素敏感性" &&
                          (!filters.insMethod || !filters.insUnit)
                        )
                          setDialog({ type: "filters" });
                      }}
                    >
                      {sortFields.map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} />
                  </div>
                </div>
                {(active.length > 0 || source !== "全部来源") && (
                  <div className="applied">
                    {source !== "全部来源" && (
                      <button onClick={() => setSource("全部来源")}>
                        {source}
                        <X size={11} />
                      </button>
                    )}
                    {active.map(([k, v]) => {
                      const prefix = k.replace(/Min$|Max$/, "");
                      return (
                        <button
                          key={k}
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              [k]: blankFilters()[k],
                            }))
                          }
                        >
                          {(tagsTitle[k] || tagsTitle[prefix] || prefix) +
                            (k.endsWith("Min")
                              ? " ≥ "
                              : k.endsWith("Max")
                                ? " ≤ "
                                : " · ")}
                          {Array.isArray(v) ? v.join("、") : v}
                          <X size={11} />
                        </button>
                      );
                    })}
                    <button className="clear" onClick={reset}>
                      重置
                    </button>
                  </div>
                )}
                {filtered.length ? (
                  <div className="paper-list">
                    {filtered.slice((p - 1) * 6, p * 6).map((s) => (
                      <Card
                        key={s.id}
                        s={s}
                        onView={showStudy}
                        toggle={toggle}
                        busy={saving === s.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="panel">
                    <Empty
                      icon={tab === "star" ? Bookmark : Search}
                      title={
                        tab === "star"
                          ? "当前条件下没有已收藏文献"
                          : "没有符合条件的文献"
                      }
                      action={
                        <button className="btn small" onClick={reset}>
                          查看全部文献
                        </button>
                      }
                    >
                      {tab === "star"
                        ? "点击文献卡片右上角的书签，即可在这里查看。"
                        : "可以调整筛选条件、清空搜索，或从数据库检索并导入更多研究。"}
                    </Empty>
                  </div>
                )}
                {filtered.length > 0 && (
                  <div className="pager records-pager">
                    <small>
                      显示 {(p - 1) * 6 + 1}–{Math.min(p * 6, filtered.length)}{" "}
                      篇，共 {filtered.length} 篇
                    </small>
                    <div>
                      <button
                        className="icon-btn"
                        disabled={p === 1}
                        aria-label="上一页"
                        onClick={() => pager(p - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span>
                        {p} / {pages}
                      </span>
                      <button
                        className="icon-btn"
                        disabled={p === pages}
                        aria-label="下一页"
                        onClick={() => pager(p + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </section>
              <aside className="rail">
                <section className="panel source-panel">
                  <SectionHead icon={Database} title="数据库来源" />
                  <div className="source-rows">
                    <button
                      className={
                        "source-row all " +
                        (source === "全部来源" ? "selected" : "")
                      }
                      onClick={() => {
                        setSource("全部来源");
                        setNum(1);
                      }}
                    >
                      <Layers size={16} />
                      <span>全部来源</span>
                      <b>{studies.length}</b>
                    </button>
                    {sourceList.map((d) => (
                      <button
                        key={d.id}
                        className={
                          "source-row " + (source === d.id ? "selected" : "")
                        }
                        onClick={() => {
                          setSource(d.id);
                          setNum(1);
                        }}
                      >
                        <span
                          className="source-dot"
                          style={{ background: d.color }}
                        />
                        <span>{d.name}</span>
                        <b>
                          {
                            studies.filter((s) => s.sources.includes(d.id))
                              .length
                          }
                        </b>
                      </button>
                    ))}
                  </div>
                  <button
                    className="panel-link"
                    onClick={() => navigate("search")}
                  >
                    前往跨库检索
                    <ArrowRight size={15} />
                  </button>
                </section>
                <section className="panel queue-panel">
                  <SectionHead icon={ListChecks} title="处理队列" />
                  {["待下载全文", "待提取原始数据", "可用于Meta分析"].map(
                    (v, i) => (
                      <button
                        className="queue-row"
                        key={v}
                        onClick={() => quickStatus(v)}
                      >
                        <i className={"dot-" + i} />
                        <span>{v}</span>
                        <b>
                          {
                            studies.filter(
                              (s) => s.tasks.includes(v) || s.meta === v,
                            ).length
                          }
                        </b>
                        <ChevronRight size={14} />
                      </button>
                    ),
                  )}
                </section>
                <section className="panel keyword-preview">
                  <SectionHead icon={Tags} title="关键词框架" />
                  <div className="term-chips">
                    <span>运动干预</span>
                    <span>糖尿病前期</span>
                    <span>HbA1c</span>
                    <span>resistance training</span>
                  </div>
                  <button
                    className="panel-link"
                    onClick={() => navigate("keywords")}
                  >
                    查看完整词表
                    <ArrowRight size={15} />
                  </button>
                </section>
              </aside>
            </div>
          </>
        ) : page === "search" ? (
          <SearchCenter
            lib={lib}
            notify={notify}
            startPreset={searchPreset}
            onImport={(db) => add(db, "import")}
          />
        ) : (
          <Keywords lib={lib} notify={notify} toSearch={allToSearch} />
        )}
      </main>
      <footer className="site-footer">
        <span>
          <Activity size={15} />
          糖动研库 <i /> GLUCO ATLAS
        </span>
        <span>运动与血糖研究工作区</span>
      </footer>
      {dialog?.type === "filters" && (
        <Filters
          studies={studies}
          openNumbers={sort === "胰岛素敏感性"}
          applied={filters}
          count={(f) => relevant.filter((s) => filterStudy(s, f)).length}
          apply={(f) => {
            setFilters(f);
            setDialog(null);
          }}
          close={() => setDialog(null)}
        />
      )}{" "}
      {dialog?.type === "intake" && (
        <Intake
          lib={lib}
          notify={notify}
          initialSource={dialog.db}
          initialMode={dialog.mode}
          close={() => setDialog(null)}
        />
      )}{" "}
      {dialog?.type === "study" && (
        <Study
          key={dialog.s.id}
          lib={lib}
          study={dialog.s}
          initialTab={dialog.section}
          notify={notify}
          close={() => setDialog(null)}
        />
      )}{" "}
      {dialog?.type === "export" && (
        <Exporter
          records={filtered}
          close={() => setDialog(null)}
          notify={notify}
        />
      )}{" "}
      {toast && (
        <div role="status" className="toast">
          <CheckCheck size={17} />
          {toast}
          <button aria-label="关闭提示" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
