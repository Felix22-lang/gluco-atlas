"use client";
import { useState } from "react";
import {
  Search,
  Plus,
  Copy,
  Tags,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Layers,
  FileText,
} from "lucide-react";
import original from "#gluco-terms";
import { termGroups, unique } from "../../research/options";
import { copyText } from "../../research/io";
import { Modal, Field, Empty } from "./shared";
export function Keywords({ lib, notify, toSearch }) {
  const [q, setQ] = useState(""),
    [expanded, expand] = useState({}),
    [edit, setEdit] = useState(null),
    [draft, setDraft] = useState(""),
    [rev, setRev] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const all = (k) => [...original[k], ...(lib.extensions[k] || [])];
  const count = termGroups.reduce((a, [k]) => a + original[k].length, 0);
  const visible = termGroups.filter(([k]) =>
    all(k).some((t) => t.toLowerCase().includes(q.trim().toLowerCase())),
  );
  async function save() {
    setBusy(true);
    try {
      const words = unique(
        draft.split(/\r?\n|\s+OR\s+|[，；;]/i).map((s) => s.trim()),
      ).filter(
        (w) => !original[edit].some((t) => t.toLowerCase() === w.toLowerCase()),
      );
      await lib.write("terms", edit, { words }, rev);
      setEdit(null);
      notify("扩展词已保存");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="subpage">
      <div className="page-heading">
        <div>
          <div className="eyebrow">KEYWORD FRAMEWORK</div>
          <h1>中英文关键词框架</h1>
          <p>
            基础词表包含 {count}{" "}
            个原始词条，按运动、血糖和研究设计扩展检索。
          </p>
        </div>
        <button className="btn primary" onClick={toSearch}>
          用完整框架检索
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="search-box keyword-search">
        <Search />
        <input
          aria-label="查找关键词"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="查找中英文关键词…"
        />
      </div>
      <div className="term-grid">
        {visible.map(([key, title, lang]) => {
          const words = all(key).filter((t) =>
            t.toLowerCase().includes(q.trim().toLowerCase()),
          );
          const show = expanded[key] || q ? words : words.slice(0, 13);
          return (
            <section key={key} className="panel term-card">
              <div className="line-heading">
                <div className="term-head">
                  <span className={"lang-tile " + (lang === "EN" ? "en" : "")}>
                    {lang}
                  </span>
                  <div>
                    <h2>{title}</h2>
                    <small>
                      {original[key].length} 个原词 ·{" "}
                      {(lib.extensions[key] || []).length} 个扩展词
                    </small>
                  </div>
                </div>
                <button
                  className="icon-btn"
                  title="复制本组关键词"
                  aria-label={"复制" + title}
                  onClick={async () =>
                    notify(
                      (await copyText(all(key).join(" OR ")))
                        ? "本组词已复制"
                        : "请选中词条手动复制",
                    )
                  }
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="term-chips">
                {show.map((t, i) => (
                  <span
                    key={t + i}
                    className={
                      (lib.extensions[key] || []).includes(t) ? "added" : ""
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="term-foot">
                <button
                  className="text-link"
                  onClick={() => {
                    setEdit(key);
                    setRev(lib.revOf("terms", key));
                    setDraft((lib.extensions[key] || []).join("\n"));
                    setError("");
                  }}
                >
                  <Plus size={15} />
                  管理扩展词
                </button>
                {!q && words.length > 13 && (
                  <button
                    className="subtle-link"
                    onClick={() => expand((p) => ({ ...p, [key]: !p[key] }))}
                  >
                    {expanded[key]
                      ? "收起"
                      : `展开其余 ${words.length - 13} 个`}
                    {expanded[key] ? <ChevronUp /> : <ChevronDown />}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {!visible.length && <Empty title="没有找到相符的词条" />}
      {edit && (
        <Modal
          title={"管理" + termGroups.find((g) => g[0] === edit)[1] + "的扩展词"}
          onClose={() => {
            if (!busy) setEdit(null);
          }}
          footer={
            <>
              {error && <span className="err">{error}</span>}
              <div className="push" />
              <button className="btn primary" onClick={save} disabled={busy}>
                保存扩展词
              </button>
            </>
          }
        >
          <div className="modal-scroll">
            <p className="hint">
              每行一个词，英文短语保留空格。已保存的扩展词会进入完整检索框架。
            </p>
            <Field label="扩展词">
              <textarea
                rows={8}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  edit.endsWith("Zh")
                    ? "如 运动处方"
                    : "e.g. concurrent training"
                }
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
