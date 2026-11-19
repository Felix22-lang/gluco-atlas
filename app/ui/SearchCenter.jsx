"use client";
import { useRef, useState } from "react";
import {
  Search,
  Database,
  ExternalLink,
  ArrowRight,
  ArrowUpRight,
  Copy,
  History,
  Plus,
  Check,
  Save,
  Upload,
  ChevronRight,
  ChevronLeft,
  LoaderCircle,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { databases, sameStudy } from "../../research/options";
import { copyText, pubmedRecord } from "../../research/io";
import { buildQuery, presetLabels, dbUrl } from "../../research/query";
import { Field, Modal, Select, Empty, SectionHead } from "./shared";
import { searchMedMirror } from "../../research/pubmed-mirror";
async function searchPublicRecords(q, page, provider, cursor) {
  const params = {
    q,
    start: String(page * 20),
    provider: provider === "Europe PMC · MED" ? "mirror" : "ncbi",
    cursor: cursor || "*",
  };
  const long = q.length > 1200;
  try {
    const response = await fetch(
      "/api/pubmed" + (long ? "" : "?" + new URLSearchParams(params)),
      {
        ...(long
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(params),
            }
          : {}),
        signal: AbortSignal.timeout(26000),
      },
    );
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    return await searchMedMirror(q, cursor || "*");
  }
}
export function SearchCenter({ lib, notify, onImport, startPreset = "core" }) {
  const [db, setDb] = useState("PubMed"),
    [preset, setPreset] = useState(startPreset),
    [rct, setRct] = useState(false),
    [designLimit, setDesignLimit] = useState(false),
    [query, setQuery] = useState(() =>
      buildQuery("PubMed", startPreset, lib.extensions, false),
    ),
    [running, setRun] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [adding, setAdding] = useState(""),
    [log, setLog] = useState(false),
    [hits, setHits] = useState(""),
    [logNote, setLogNote] = useState(""),
    [logBusy, setLogBusy] = useState(false),
    [logError, setLogError] = useState(""),
    [histAll, setHistAll] = useState(false);
  const requestID = useRef(0),
    cursors = useRef(["*"]);
  const source = databases.find((d) => d.id === db);
  function revise(dbNew, mode, only, limit = designLimit) {
    setDesignLimit(limit);
    setDb(dbNew);
    setPreset(mode);
    setRct(only);
    setQuery(buildQuery(dbNew, mode, lib.extensions, only, limit));
    clear();
  }
  function clear() {
    requestID.current++;
    setRun(false);
    setResult(null);
    setError("");
    cursors.current = ["*"];
  }
  const logQuery = async (h, note, provider, dbName = db, q = query) =>
    lib.write(
      "search",
      crypto.randomUUID(),
      {
        db: dbName,
        query: q,
        hits: h,
        date: new Date().toISOString(),
        note,
        provider,
      },
      0,
    );
  async function search(page = 0) {
    const id = ++requestID.current;
    if (!query.trim()) {
      setError("请填写检索式。");
      return;
    }
    setRun(true);
    setError("");
    const requested = query.trim();
    let j;
    try {
      j = await searchPublicRecords(
        requested,
        page,
        page > 0 ? result?.provider : "PubMed",
        cursors.current[page],
      );
      if (
        page > 0 &&
        result?.provider !== "Europe PMC · MED" &&
        j.provider === "Europe PMC · MED"
      ) {
        page = 0;
        cursors.current = ["*"];
      }
      if (requestID.current !== id) return;
      if (j.cursor) cursors.current[page + 1] = j.cursor;
      setResult({ ...j, page, query: requested });
      if (page === 0) {
        try {
          await logQuery(j.total, "站内检索", j.provider, "PubMed", requested);
        } catch (e) {
          notify("检索完成，日志保存失败：" + e.message);
        }
      }
    } catch (e) {
      if (requestID.current === id) {
        setResult(null);
        setError(
          e.message?.includes("专用字段")
            ? e.message
            : "文献接口暂时不可用。可重试，或打开 PubMed 官网运行当前检索式。",
        );
      }
    } finally {
      if (requestID.current === id) setRun(false);
    }
  }
  const addOne = async (d) => {
    setAdding(d.pmid);
    try {
      const s = await lib.add(pubmedRecord(d));
      notify(
        s === "added"
          ? "文献已添加"
          : s === "merged"
            ? "已补充 PubMed 来源"
            : "这篇文献已在库中",
      );
    } catch (e) {
      notify(e.message);
    } finally {
      setAdding("");
    }
  };
  async function saveLog() {
    if (!query.trim()) {
      setLogError("检索式不能为空。");
      return;
    }
    if (hits !== "" && (!Number.isInteger(+hits) || +hits < 0)) {
      setLogError("命中数须为非负整数。");
      return;
    }
    setLogBusy(true);
    try {
      await logQuery(hits === "" ? null : +hits, logNote, "手动记录");
      setLog(false);
      notify("检索记录已保存");
    } catch (e) {
      setLogError(e.message);
    } finally {
      setLogBusy(false);
    }
  }
  function reuse(h) {
    clear();
    setDb(h.db);
    setQuery(h.query);
    setPreset("custom");
    setRct(false);
    setDesignLimit(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <div className="subpage">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DATABASE SEARCH</div>
          <h1>跨库检索</h1>
          <p>组合中英文关键词，运行检索并将题录归入对应数据库。</p>
        </div>
        <button className="btn" onClick={() => onImport(db)}>
          <Upload size={16} />
          导入题录
        </button>
      </div>
      <div className="search-layout">
        <aside className="panel lookup-side">
          <SectionHead icon={Database} title="检索数据库" />
          {databases.map((d) => (
            <button
              key={d.id}
              className={"source-choice " + (db === d.id ? "selected" : "")}
              onClick={() =>
                revise(d.id, preset === "custom" ? "core" : preset, rct)
              }
            >
              <span
                className="db-tile"
                style={{ background: d.tint, color: d.color }}
              >
                {d.short}
              </span>
              <span>{d.name}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </aside>
        <div className="lookup-main">
          <section className="panel builder">
            <div className="line-heading">
              <h2>{db} 检索式</h2>
              <span className="source-type">
                {db === "PubMed" ? "站内检索" : "官网检索"}
              </span>
            </div>
            <div className="preset-line">
              {Object.entries(presetLabels).map(([k, t]) => (
                <button
                  key={k}
                  aria-pressed={preset === k}
                  className={"option-chip " + (preset === k ? "on" : "")}
                  onClick={() => revise(db, k, rct)}
                >
                  {t}
                </button>
              ))}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={rct}
                  onChange={(e) =>
                    revise(
                      db,
                      preset === "custom" ? "core" : preset,
                      e.target.checked,
                    )
                  }
                />
                限定随机试验
              </label>
              {["中国知网", "万方", "维普"].includes(db) && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={designLimit}
                    onChange={(e) =>
                      revise(
                        db,
                        preset === "custom" ? "core" : preset,
                        rct,
                        e.target.checked,
                      )
                    }
                  />
                  使用原文设计限定词
                </label>
              )}
            </div>
            <Field label="可编辑检索式">
              <textarea
                rows={5}
                spellCheck="false"
                className="query-text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPreset("custom");
                  clear();
                }}
              />
            </Field>
            <p className="hint">
              <Info size={15} />
              {source.hint}
            </p>
            <div className="actions wrap">
              {db === "PubMed" && (
                <button
                  className="btn primary"
                  disabled={running || !query.trim()}
                  onClick={() => search(0)}
                >
                  {running ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Search size={16} />
                  )}{" "}
                  {running ? "正在检索" : "运行检索"}
                </button>
              )}
              <a
                className={"btn " + (db === "PubMed" ? "" : "primary")}
                href={dbUrl(source, query)}
                target="_blank"
                rel="noreferrer"
              >
                打开{db === "PubMed" ? " PubMed " : ""}官网
                <ArrowUpRight size={15} />
              </a>
              <button
                className="btn"
                onClick={async () =>
                  notify(
                    (await copyText(query))
                      ? "检索式已复制"
                      : "请选中检索式手动复制",
                  )
                }
              >
                <Copy size={15} />
                复制
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  setHits("");
                  setLogNote("");
                  setLogError("");
                  setLog(true);
                }}
              >
                <Save size={15} />
                保存检索记录
              </button>
            </div>
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
          </section>
          {result && (
            <section className="panel live-results">
              <SectionHead icon={Search} title="检索结果">
                <span>{result.total.toLocaleString()} 条命中</span>
              </SectionHead>
              <p className="hint">
                数据源 {result.provider} · 本页 {result.items.length} 篇
                {result.provider !== "PubMed"
                  ? " · 使用 Europe PMC 中带 PMID 的 MED 题录。"
                  : ""}
              </p>
              {!result.items.length ? (
                <Empty title="未检索到文献">
                  尝试删除限定词或扩大运动关键词。
                </Empty>
              ) : (
                result.items.map((d, i) => {
                  const exists = lib.studies.some(
                    (s) => sameStudy(s, d) && s.sources.includes("PubMed"),
                  );
                  return (
                    <div key={d.pmid} className="live-item">
                      <div>
                        <a
                          href={
                            "https://pubmed.ncbi.nlm.nih.gov/" + d.pmid + "/"
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {d.title}
                        </a>
                        <small>
                          {d.journal} · {d.year} · PMID {d.pmid}
                        </small>
                      </div>
                      <button
                        className="btn small"
                        disabled={exists || !!adding}
                        onClick={() => addOne(d)}
                      >
                        {exists ? <Check size={14} /> : <Plus size={14} />}{" "}
                        {exists
                          ? "已在库中"
                          : adding === d.pmid
                            ? "保存中"
                            : "入库"}
                      </button>
                    </div>
                  );
                })
              )}
              <div className="pager">
                <button
                  className="btn small"
                  disabled={running || result.page === 0}
                  onClick={() => search(result.page - 1)}
                >
                  <ChevronLeft size={14} />
                  上一页
                </button>
                <small>第 {result.page + 1} 页</small>
                <button
                  className="btn small"
                  disabled={
                    running ||
                    (result.page + 1) * 20 >= Math.min(10000, result.total)
                  }
                  onClick={() => search(result.page + 1)}
                >
                  下一页
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>
          )}
          <section className="panel history-panel">
            <SectionHead icon={History} title="检索记录">
              <span>{lib.history.length} 条</span>
            </SectionHead>
            {lib.history.length ? (
              lib.history.slice(0, histAll ? undefined : 4).map((h) => (
                <div className="history-row" key={h.id}>
                  <div className="line-heading">
                    <strong>{h.db}</strong>
                    <small>
                      {new Date(h.date).toLocaleDateString("zh-CN")}
                    </small>
                  </div>
                  <p>{h.query}</p>
                  <div className="line-heading">
                    <small>
                      {h.hits == null ? "命中数未登记" : h.hits + " 条命中"}
                      {h.note ? " · " + h.note : ""}
                    </small>
                    <button className="text-link" onClick={() => reuse(h)}>
                      复用检索式
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-hint">
                运行一次站内检索，或保存官网检索式后，可在这里查看与复用。
              </p>
            )}
            {lib.history.length > 4 && (
              <button
                className="text-link"
                onClick={() => setHistAll(!histAll)}
              >
                {histAll ? "收起" : "查看全部记录"}
              </button>
            )}
          </section>
        </div>
      </div>
      {log && (
        <Modal
          title="保存检索记录"
          onClose={() => {
            if (!logBusy) setLog(false);
          }}
          footer={
            <>
              {logError && <span className="err">{logError}</span>}
              <div className="push" />
              <button
                className="btn primary"
                disabled={logBusy}
                onClick={saveLog}
              >
                保存
              </button>
            </>
          }
        >
          <div className="modal-scroll">
            <b>{db}</b>
            <p className="query-preview">{query}</p>
            <Field label="官网命中数（可留空）">
              <input
                type="number"
                min="0"
                value={hits}
                onChange={(e) => setHits(e.target.value)}
              />
            </Field>
            <Field label="检索备注">
              <textarea
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="如 使用的索引库、日期范围、筛选条件"
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
