"use client";
import { useState } from "react";
import {
  FileDown,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  Save,
  Table2,
  FlaskConical,
  Timer,
  FileText,
  BookOpen,
  Check,
} from "lucide-react";
import {
  Modal,
  Field,
  Select,
  Chips,
  Empty,
  StudyTags,
  changeIn,
} from "./shared";
import {
  accessTypes,
  databases,
  designs,
  modes,
  risks,
  metaTypes,
  rawTypes,
  tasks,
  outcomes,
  stages,
  newArm,
  newMeasure,
  issue,
  safeUrl,
  known,
  unique,
} from "../../research/options";
const dbNames = [...databases.map((d) => d.id), "期刊官网", "其他"];
const tabs = [
  ["overview", "研究信息"],
  ["dose", "运动处方"],
  ["data", "结局数据"],
  ["review", "筛选判定"],
];
const dash = (v) => (v === "" || v === null || v === undefined ? "—" : v);
function Facts({ rows }) {
  return (
    <dl className="facts">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{dash(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
function ResultTable({ study, edit, choose, remove }) {
  const [category, setCategory] = useState(""),
    [point, setPoint] = useState("");
  const list = study.measures
    .map((m, i) => [m, i])
    .filter(
      ([m]) =>
        (!category || m.outcome === category) && (!point || m.stage === point),
    );
  return (
    <>
      <div className="sub-toolbar">
        <Select
          aria-label="选择结局"
          value={category}
          onChange={setCategory}
          all
          placeholder="全部指标"
          options={outcomes}
        />
        <Select
          aria-label="选择时间点"
          value={point}
          onChange={setPoint}
          all
          placeholder="全部时间点"
          options={stages}
        />
        <small>{list.length} 条提取值</small>
      </div>
      {list.length ? (
        <div className="table-scroll">
          <table className="extract-table">
            <thead>
              <tr>
                <th>组别 / 时间点</th>
                <th>结局 / 单位</th>
                <th>分析 n</th>
                <th>均值</th>
                <th>离散量</th>
                <th>原文定位</th>
                {edit && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {list.map(([m, i]) => (
                <tr key={i}>
                  <td>
                    {study.arms.find((a) => a.id === m.arm)?.name || "—"}
                    <small>
                      {m.stage} {m.point}
                    </small>
                  </td>
                  <td>
                    {m.outcome}
                    <small>
                      {m.method} {m.unit}
                    </small>
                  </td>
                  <td>{dash(m.n)}</td>
                  <td>{dash(m.mean)}</td>
                  <td>
                    {m.stat === "95% CI"
                      ? `${dash(m.low)} 至 ${dash(m.high)}`
                      : dash(m.spread)}
                    <small>{m.stat}</small>
                  </td>
                  <td>{dash(m.source)}</td>
                  {edit && (
                    <td>
                      <button
                        className="icon-btn"
                        aria-label="编辑这一行"
                        onClick={() => choose(i)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-btn danger"
                        aria-label="移除这一行"
                        onClick={() => remove(i)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          icon={Table2}
          title={
            study.measures.length ? "没有符合条件的提取值" : "尚待提取分组数据"
          }
        >
          {study.measures.length
            ? "选择其他指标或时间点。"
            : "按研究组和时间点录入样本量、均值、离散量与原文表号。"}
        </Empty>
      )}
    </>
  );
}
export function Study({ study, initialTab = "overview", lib, close, notify }) {
  const [s, setS] = useState(() => structuredClone(study)),
    [rev, setRev] = useState(() => lib.revOf("study", study.id)),
    [tab, setTab] = useState(initialTab),
    [edit, setEdit] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [line, setLine] = useState(null),
    [dirty, setDirty] = useState(false),
    [leave, setLeave] = useState(false);
  const set = (k, v) => {
    setS((p) => ({ ...p, [k]: v }));
    setDirty(true);
    setError("");
  };
  const changeArm = (i, k, v) => set("arms", changeIn(s.arms, i, k, v));
  const single = (label, key, opts) => (
    <Field label={label}>
      <Select value={s[key]} onChange={(v) => set(key, v)} options={opts} />
    </Field>
  );
  const input = (label, k, opt = {}) => (
    <Field label={label} wide={opt.wide}>
      <input
        type={opt.type || "text"}
        min={opt.type === "number" ? 0 : undefined}
        value={s[k] ?? ""}
        onChange={(e) => set(k, e.target.value)}
        placeholder={opt.placeholder}
      />
    </Field>
  );
  async function save() {
    const msg = issue(s);
    if (msg) {
      setError(msg);
      return;
    }
    if (line !== null) {
      setError("请先完成或取消正在编辑的结局数据行。");
      return;
    }
    setSaving(true);
    try {
      const value = {
        ...s,
        reported: unique([...s.reported, ...s.measures.map((m) => m.outcome)]),
      };
      const r = await lib.write("study", s.id, value, rev);
      setS(value);
      setRev(r.rev);
      setDirty(false);
      setEdit(false);
      setError("");
      notify("研究记录已保存");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  const requestClose = () => {
    if (saving) return;
    if (dirty || line !== null) {
      setLeave(true);
      return;
    }
    close();
  };
  const setRow = (k, v) =>
    setLine((p) => ({ ...p, item: { ...p.item, [k]: v } }));
  function commitRow() {
    const m = line.item;
    if (!m.arm || !known(m.mean) || !m.unit.trim()) {
      setError("请填写组别、均值和单位。");
      return;
    }
    if (
      [m.n, m.spread].some((v) => known(v) && +v < 0) ||
      (known(m.n) && (!Number.isInteger(+m.n) || +m.n === 0))
    ) {
      setError("样本量须为正整数，SD 或 SE 须大于或等于零。");
      return;
    }
    if (
      m.stat === "95% CI" &&
      (!known(m.low) || !known(m.high) || +m.low > +m.high)
    ) {
      setError("请核对 95% CI 的上下限。");
      return;
    }
    const rows = [...s.measures];
    if (line.i < 0) rows.push(m);
    else rows[line.i] = m;
    set("measures", rows);
    setLine(null);
  }
  const foot = (
    <>
      {leave ? (
        <>
          <span className="warn">有尚未保存的修改。</span>
          <button className="btn" onClick={() => setLeave(false)}>
            继续编辑
          </button>
          <button className="btn" onClick={close}>
            放弃并关闭
          </button>
        </>
      ) : (
        <>
          {error && (
            <span role="alert" className="err">
              {error}
            </span>
          )}
          <div className="push" />
          {edit ? (
            <>
              <button className="btn" onClick={requestClose}>
                关闭
              </button>
              <button className="btn primary" disabled={saving} onClick={save}>
                <Save size={15} />
                {saving ? "正在保存" : "保存研究记录"}
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={() => setEdit(true)}>
              <Pencil size={15} />
              编辑记录
            </button>
          )}
        </>
      )}
    </>
  );
  return (
    <Modal
      title={s.title}
      subtitle="STUDY RECORD"
      wide
      onClose={requestClose}
      footer={foot}
    >
      <div className="detail-intro">
        <StudyTags s={s} />
        <div className="detail-links">
          {safeUrl(s.fulltext) && (
            <a
              className="text-link"
              href={safeUrl(s.fulltext)}
              target="_blank"
              rel="noreferrer"
            >
              全文页
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
      <div className="sheet-tabs">
        {tabs.map(([id, t]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
          >
            {t}
            {id === "data" && <small>{s.measures.length}</small>}
          </button>
        ))}
      </div>
      <div className="modal-scroll" key={tab}>
        {tab === "overview" &&
          (edit ? (
            <>
              <div className="formgrid">
                {input("显示题名", "title", { wide: true })}
                {input("原文题名", "original", { wide: true })}
                {input("作者", "authors")}
                {input("期刊", "journal")}
                {input("发表年份", "year", { type: "number" })}
                {input("总样本量（随机或入组）", "sample", { type: "number" })}
                {input("DOI", "doi")}
                {input("PMID", "pmid")}
                {single("研究设计", "design", designs)}
                {single("是否为 RCT", "rct", ["是", "否", "待核实"])}
                {single("研究人群", "population", [
                  "2 型糖尿病",
                  "糖尿病前期",
                  "1 型糖尿病",
                  "混合人群",
                  "其他",
                  "待核实",
                ])}
                {single("全文获取", "access", accessTypes)}
                {input("公开 PDF 链接", "pdf", { wide: true })}
                {input("全文页面", "fulltext", { wide: true })}
              </div>
              <h3 className="form-title">题录来源</h3>
              <Chips
                options={dbNames}
                value={s.sources}
                set={(v) => set("sources", v)}
              />
              <h3 className="form-title">来源或数据仓库链接</h3>
              {s.links.map((l, i) => (
                <div className="inline-form" key={i}>
                  <input
                    aria-label="链接说明"
                    value={l.name}
                    placeholder="链接说明"
                    onChange={(e) =>
                      set("links", changeIn(s.links, i, "name", e.target.value))
                    }
                  />
                  <input
                    aria-label="链接地址"
                    value={l.url}
                    placeholder="https://"
                    onChange={(e) =>
                      set("links", changeIn(s.links, i, "url", e.target.value))
                    }
                  />
                  <button
                    className="icon-btn"
                    aria-label="移除链接"
                    onClick={() =>
                      set(
                        "links",
                        s.links.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                className="btn small"
                onClick={() =>
                  set("links", [...s.links, { name: "", url: "" }])
                }
              >
                <Plus size={14} />
                添加链接
              </button>
              <Field label="研究笔记">
                <textarea
                  rows="3"
                  value={s.note}
                  onChange={(e) => set("note", e.target.value)}
                />
              </Field>
            </>
          ) : (
            <>
              {s.original && <p className="original-title">{s.original}</p>}
              <Facts
                rows={[
                  ["作者", s.authors],
                  ["发表期刊", s.journal],
                  ["发表年份", s.year],
                  ["研究设计", s.design],
                  ["人群", s.population],
                  ["总样本量", s.sample],
                  ["数据库来源", s.sources.join("、")],
                  ["是否为 RCT", s.rct],
                  ["DOI", s.doi],
                  ["PMID", s.pmid],
                ]}
              />
              {s.note && (
                <div className="paper-note">
                  <BookOpen size={17} />
                  <div>
                    <b>研究笔记</b>
                    <p>{s.note}</p>
                  </div>
                </div>
              )}
              <h3 className="form-title">原始来源</h3>
              <div className="link-list">
                {s.doi && (
                  <a
                    href={"https://doi.org/" + s.doi}
                    target="_blank"
                    rel="noreferrer"
                  >
                    DOI 原文入口 <ExternalLink size={13} />
                  </a>
                )}
                {s.links
                  .filter((l) => safeUrl(l.url))
                  .map((l, i) => (
                    <a
                      key={i}
                      href={safeUrl(l.url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l.name || "来源页面"} <ExternalLink size={13} />
                    </a>
                  ))}
              </div>
            </>
          ))}
        {tab === "dose" && (
          <>
            {edit ? (
              <>
                <div className="formgrid">
                  {input("干预周数", "weeks", { type: "number" })}
                  {input("原文时长", "duration", { placeholder: "如 4 个月" })}
                </div>
                <h3 className="form-title">运动类型</h3>
                <Chips
                  options={modes}
                  value={s.modes}
                  set={(v) => set("modes", v)}
                />
              </>
            ) : (
              <Facts
                rows={[
                  ["干预周期", known(s.weeks) ? s.weeks + " 周" : s.duration],
                  ["运动类型", s.modes.join("、")],
                ]}
              />
            )}
            <div className="line-heading">
              <h3>分组训练处方</h3>
              {edit && (
                <button
                  className="btn small"
                  onClick={() => set("arms", [...s.arms, newArm()])}
                >
                  <Plus size={14} />
                  添加研究组
                </button>
              )}
            </div>
            <p className="hint">
              训练剂量以分钟/周记录。有氧占比以同组有氧和抗阻分钟之和为分母。空白表示待核实。
            </p>
            {edit ? (
              s.arms.map((a, i) => (
                <div key={a.id} className="arm-editor">
                  <div className="line-heading">
                    <b>研究组 {i + 1}</b>
                    <button
                      className="icon-btn"
                      aria-label="移除研究组"
                      disabled={s.measures.some((m) => m.arm === a.id)}
                      onClick={() =>
                        set(
                          "arms",
                          s.arms.filter((_, j) => i !== j),
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="formgrid tri">
                    <Field label="组名">
                      <input
                        value={a.name}
                        onChange={(e) => changeArm(i, "name", e.target.value)}
                      />
                    </Field>
                    <Field label="组别角色">
                      <Select
                        value={a.role}
                        onChange={(v) => changeArm(i, "role", v)}
                        options={["干预", "活性对照", "对照"]}
                      />
                    </Field>
                    {[
                      ["randomized", "随机人数"],
                      ["analyzed", "分析人数"],
                      ["aero", "有氧 min/周"],
                      ["res", "抗阻 min/周"],
                      ["total", "合计 min/周"],
                    ].map(([k, t]) => (
                      <Field label={t} key={k}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={a[k] ?? ""}
                          onChange={(e) => changeArm(i, k, e.target.value)}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ))
            ) : s.arms.length ? (
              <div className="table-scroll">
                <table className="extract-table">
                  <thead>
                    <tr>
                      {[
                        "研究组",
                        "随机 n",
                        "分析 n",
                        "有氧",
                        "抗阻",
                        "合计",
                        "有氧占比",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.arms.map((a) => (
                      <tr key={a.id}>
                        <td>
                          {a.name}
                          <small>{a.role}</small>
                        </td>
                        {["randomized", "analyzed", "aero", "res", "total"].map(
                          (k) => (
                            <td key={k}>{dash(a[k])}</td>
                          ),
                        )}
                        <td>
                          {known(a.aero) && known(a.res) && +a.aero + +a.res > 0
                            ? ((100 * a.aero) / (+a.aero + +a.res)).toFixed(1) +
                              "%"
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty icon={Timer} title="分组运动处方待提取" />
            )}
            {edit ? (
              <Field label="剂量口径与换算依据">
                <textarea
                  rows="3"
                  value={s.doseNote}
                  onChange={(e) => set("doseNote", e.target.value)}
                />
              </Field>
            ) : (
              s.doseNote && <p className="soft-note">{s.doseNote}</p>
            )}
          </>
        )}
        {tab === "data" && (
          <>
            <h3 className="first-title">报告的结局指标</h3>
            {edit ? (
              <Chips
                options={outcomes}
                value={s.reported}
                set={(v) => set("reported", v)}
              />
            ) : (
              <div className="keywords-inline">
                {s.reported.length
                  ? s.reported.map((k) => <span key={k}>{k}</span>)
                  : "待核实"}
              </div>
            )}
            <div className="line-heading">
              <h3>分组数据提取表</h3>
              {edit && line === null && (
                <button
                  className="btn small"
                  onClick={() => {
                    if (!s.arms.length) {
                      setTab("dose");
                      setError("请先添加至少一个研究组。");
                      return;
                    }
                    setLine({
                      i: -1,
                      item: { ...newMeasure(), arm: s.arms[0].id },
                    });
                  }}
                >
                  <Plus size={14} />
                  添加提取值
                </button>
              )}
            </div>
            {edit && line && (
              <div className="arm-editor">
                <h4>{line.i < 0 ? "新增提取值" : "编辑提取值"}</h4>
                <div className="formgrid tri">
                  <Field label="研究组">
                    <Select
                      value={line.item.arm}
                      onChange={(v) => setRow("arm", v)}
                      options={s.arms.map((a) => [a.id, a.name])}
                    />
                  </Field>
                  <Field label="结局">
                    <Select
                      value={line.item.outcome}
                      onChange={(v) => setRow("outcome", v)}
                      options={outcomes}
                    />
                  </Field>
                  <Field label="时间点">
                    <Select
                      value={line.item.stage}
                      onChange={(v) => setRow("stage", v)}
                      options={stages}
                    />
                  </Field>
                  {[
                    ["point", "原文测量时间"],
                    ["method", "测量方法"],
                    ["unit", "单位"],
                    ["n", "组别分析 n"],
                    ["mean", "均值"],
                  ].map(([k, t]) => (
                    <Field label={t} key={k}>
                      <input
                        type={["n", "mean"].includes(k) ? "number" : "text"}
                        step="any"
                        value={line.item[k] ?? ""}
                        onChange={(e) => setRow(k, e.target.value)}
                      />
                    </Field>
                  ))}
                  <Field label="离散量类型">
                    <Select
                      value={line.item.stat}
                      onChange={(v) => setRow("stat", v)}
                      options={["SD", "SE", "95% CI", "未报告"]}
                    />
                  </Field>
                  {(line.item.stat === "95% CI"
                    ? [
                        ["low", "CI 下限"],
                        ["high", "CI 上限"],
                      ]
                    : line.item.stat === "未报告"
                      ? []
                      : [["spread", line.item.stat]]
                  ).map(([k, t]) => (
                    <Field label={t} key={k}>
                      <input
                        type="number"
                        step="any"
                        value={line.item[k] ?? ""}
                        onChange={(e) => setRow(k, e.target.value)}
                      />
                    </Field>
                  ))}
                  <Field label="原文定位" wide>
                    <input
                      placeholder="如 表 2，第 5 页"
                      value={line.item.source}
                      onChange={(e) => setRow("source", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="actions">
                  <button
                    className="btn small"
                    onClick={() => {
                      setLine(null);
                      setError("");
                    }}
                  >
                    取消本行
                  </button>
                  <button className="btn primary small" onClick={commitRow}>
                    <Check size={14} />
                    确认本行
                  </button>
                </div>
              </div>
            )}
            <ResultTable
              study={s}
              edit={edit && line === null}
              choose={(i) => setLine({ i, item: { ...s.measures[i] } })}
              remove={(i) =>
                set(
                  "measures",
                  s.measures.filter((_, j) => j !== i),
                )
              }
            />
          </>
        )}
        {tab === "review" &&
          (edit ? (
            <>
              <div className="formgrid">
                {single("RCT 分组数据可提取性", "raw", rawTypes)}
                {single("偏倚风险", "risk", risks)}
                <Field label="偏倚判定依据" wide>
                  <textarea
                    rows="2"
                    value={s.riskNote}
                    onChange={(e) => set("riskNote", e.target.value)}
                    placeholder="工具、评估结局、相应条目与理由"
                  />
                </Field>
                {single("Meta 分析纳入资格", "meta", metaTypes)}
                <Field label="纳排理由与适用方案" wide>
                  <textarea
                    rows="3"
                    value={s.reason}
                    onChange={(e) => set("reason", e.target.value)}
                  />
                </Field>
              </div>
              <h3 className="form-title">处理状态（可多选）</h3>
              <Chips
                options={tasks}
                value={s.tasks}
                set={(v) => set("tasks", v)}
              />
            </>
          ) : (
            <>
              <Facts
                rows={[
                  ["RCT 分组数据", s.raw],
                  ["偏倚风险", s.risk],
                  ["Meta 分析资格", s.meta],
                  ["处理状态", s.tasks.join("、") || "暂无待办"],
                  ["偏倚依据", s.riskNote],
                  ["纳排理由", s.reason],
                ]}
              />
              <p className="hint">
                可提取性指能够取得论文报告的分组统计量。Meta
                纳入资格按具体研究方案独立判定。
              </p>
            </>
          ))}
      </div>
    </Modal>
  );
}
