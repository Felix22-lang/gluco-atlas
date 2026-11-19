"use client";
import { useRef, useState } from "react";
import {
  ClipboardList,
  FilePlus2,
  FileUp,
  Upload,
  Check,
  Plus,
  FileSpreadsheet,
  Braces,
  Download,
} from "lucide-react";
import { Modal, Field, Select } from "./shared";
import {
  databases,
  emptyStudy,
  sameStudy,
  issue,
} from "../../research/options";
import { parseImports, exportRecords } from "../../research/io";
const sources = [...databases.map((d) => d.id), "期刊官网", "其他"];
export function Intake({
  lib,
  close,
  notify,
  initialSource = "PubMed",
  initialMode = "manual",
}) {
  const [mode, setMode] = useState(initialMode),
    [source, setSource] = useState(initialSource),
    [draft, setDraft] = useState(emptyStudy),
    [raw, setRaw] = useState(""),
    [fileName, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(null),
    [done, setDone] = useState("");
  const ref = useRef(null);
  const change = (k, v) => {
    setDraft((p) => ({ ...p, [k]: v }));
    setError("");
  };
  const load = (text) => {
    setRaw(text);
    setPreview(null);
    setError("");
    setDone("");
  };
  async function file(f) {
    if (!f) return;
    if (f.size > 6e6) {
      setError("请选择小于 6 MB 的题录文件。");
      return;
    }
    setName(f.name);
    load(await f.text());
  }
  async function submit() {
    setError("");
    setBusy(true);
    try {
      if (mode === "manual") {
        const s = { ...draft, title: draft.title.trim(), sources: [source] };
        const msg = issue(s);
        if (msg) throw new Error(msg);
        const res = await lib.add(s);
        notify(
          res === "added"
            ? "文献已入库，可打开记录继续提取数据"
            : res === "merged"
              ? "已为已有文献补充来源"
              : "这篇文献已在库中",
        );
        close();
        return;
      }
      if (!preview) {
        const list = parseImports(raw, source);
        if (!list.length)
          throw new Error("没有识别到题名。请检查所选导出格式或改用手动录入。");
        setPreview(list);
        return;
      }
      let added = 0,
        merged = 0,
        duplicates = 0,
        completed = 0;
      try {
        for (const s of preview) {
          const result = await lib.add(s);
          result === "added"
            ? added++
            : result === "merged"
              ? merged++
              : duplicates++;
          completed++;
        }
      } catch (e) {
        setPreview(preview.slice(completed));
        throw new Error(
          `已处理 ${completed} 条，余下 ${preview.length - completed} 条可重试。${e.message}`,
        );
      }
      const message = `新增 ${added} 篇，补充来源 ${merged} 篇，跳过重复 ${duplicates} 篇。`;
      setPreview(null);
      setDone(message);
      notify(message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const topMode = (v) => {
    setMode(v);
    setError("");
    setDone("");
  };
  return (
    <Modal
      title="添加文献"
      subtitle="ADD TO LIBRARY"
      onClose={() => {
        if (!busy) close();
      }}
      footer={
        <>
          {error && (
            <small role="alert" className="err">
              {error}
            </small>
          )}
          <div className="push" />
          <button className="btn" disabled={busy} onClick={close}>
            {done ? "关闭" : "取消"}
          </button>
          {!done && (
            <button className="btn primary" disabled={busy} onClick={submit}>
              {mode === "manual" ? <Plus size={15} /> : <Upload size={15} />}{" "}
              {busy
                ? "正在保存…"
                : mode === "manual"
                  ? "保存到文献库"
                  : preview
                    ? `确认导入 ${preview.length} 篇`
                    : "预览题录"}
            </button>
          )}
        </>
      }
    >
      <div className="sheet-tabs">
        {[
          ["manual", "手动录入"],
          ["import", "批量导入"],
        ].map(([k, v]) => (
          <button
            key={k}
            disabled={busy}
            className={mode === k ? "active" : ""}
            onClick={() => topMode(k)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="modal-scroll">
        {done ? (
          <div className="success-box">
            <Check />
            {done}
          </div>
        ) : (
          <>
            <Field label="本次题录来源">
              <Select
                value={source}
                options={sources}
                onChange={(v) => {
                  setSource(v);
                  setPreview(null);
                }}
              />
            </Field>
            {mode === "manual" ? (
              <div className="formgrid">
                <Field label="研究题名 *" wide>
                  <textarea
                    value={draft.title}
                    rows={2}
                    onChange={(e) => change("title", e.target.value)}
                    placeholder="输入中文或原文题名"
                  />
                </Field>
                {[
                  ["authors", "作者"],
                  ["journal", "期刊"],
                  ["year", "发表年份"],
                  ["pmid", "PMID"],
                  ["doi", "DOI"],
                ].map(([k, n]) => (
                  <Field key={k} label={n} wide={k === "doi"}>
                    <input
                      type={k === "year" ? "number" : "text"}
                      value={draft[k]}
                      onChange={(e) => change(k, e.target.value)}
                    />
                  </Field>
                ))}
              </div>
            ) : (
              <>
                <div
                  className="upload-box"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    file(e.dataTransfer.files[0]);
                  }}
                >
                  <FileUp size={28} />
                  <b>{fileName || "选择或拖入题录文件"}</b>
                  <small>RIS、PubMed NBIB、EndNote、RefWorks 或本站 JSON</small>
                  <button
                    className="btn small"
                    onClick={() => ref.current.click()}
                  >
                    选择文件
                  </button>
                  <input
                    ref={ref}
                    hidden
                    type="file"
                    accept=".ris,.nbib,.txt,.enw,.ciw,.json"
                    onChange={(e) => file(e.target.files[0])}
                  />
                </div>
                <Field label="或粘贴导出的题录">
                  <textarea
                    rows={5}
                    value={raw}
                    onChange={(e) => load(e.target.value)}
                    placeholder="在此粘贴题录原文…"
                  />
                </Field>
                {preview && (
                  <div className="import-preview">
                    <b>识别到 {preview.length} 篇</b>
                    <small>
                      其中{" "}
                      {
                        preview.filter((s) =>
                          lib.studies.some((existing) =>
                            sameStudy(s, existing),
                          ),
                        ).length
                      }{" "}
                      篇已在库中，已有提取数据将保留。
                    </small>
                    <ol>
                      {preview.slice(0, 5).map((s, i) => (
                        <li key={i}>{s.title}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
export function Exporter({ records, close, notify }) {
  const [fmt, setFmt] = useState("csv");
  return (
    <Modal
      title="导出检索结果"
      subtitle="EXPORT RECORDS"
      onClose={close}
      footer={
        <>
          <span className="muted">当前筛选结果共 {records.length} 篇</span>
          <div className="push" />
          <button
            className="btn primary"
            onClick={() => {
              exportRecords(records, fmt);
              notify("已生成导出文件");
              close();
            }}
          >
            <Download size={16} />
            导出 {fmt.toUpperCase()}
          </button>
        </>
      }
    >
      <div className="modal-scroll">
        {[
          [
            "csv",
            "结构化提取表",
            "按研究组、结局和时间点逐行导出，可直接在 Excel 中打开。",
            FileSpreadsheet,
          ],
          [
            "json",
            "完整文献记录",
            "包含题录、处方、分组数据、来源及审阅状态，可重新导入。",
            Braces,
          ],
        ].map(([k, t, desc, Icon]) => (
          <button
            key={k}
            className={"format-item " + (fmt === k ? "chosen" : "")}
            onClick={() => setFmt(k)}
          >
            <Icon />
            <div>
              <strong>{t}</strong>
              <p>{desc}</p>
            </div>
            <span className="radio-mark" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
