"use client";
import { useState } from "react";
import { RotateCcw, Info } from "lucide-react";
import { Modal, Field, Select, Chips } from "./shared";
import {
  blankFilters,
  designs,
  modes,
  metaTypes,
  accessTypes,
  rawTypes,
  risks,
  tasks,
  outcomes,
  stages,
  known,
} from "../../research/options";
export function Filters({
  applied,
  apply,
  close,
  count,
  openNumbers = false,
  studies = [],
}) {
  const [f, setF] = useState({ ...applied }),
    [message, setMessage] = useState("");
  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setMessage("");
  };
  const selector = (label, key, opts) => (
    <Field label={label}>
      <Select all value={f[key]} onChange={(v) => set(key, v)} options={opts} />
    </Field>
  );
  const ranged = (label, key, unit = "", allowNegative = false) => (
    <div className="range-field" key={key}>
      <span>
        {label} {unit && <small>{unit}</small>}
      </span>
      <div>
        <input
          aria-label={label + " 最小值"}
          type="number"
          min={allowNegative ? undefined : 0}
          step="any"
          placeholder="最小值"
          value={f[key + "Min"]}
          onChange={(e) => set(key + "Min", e.target.value)}
        />
        <em>至</em>
        <input
          aria-label={label + " 最大值"}
          type="number"
          min={allowNegative ? undefined : 0}
          step="any"
          placeholder="最大值"
          value={f[key + "Max"]}
          onChange={(e) => set(key + "Max", e.target.value)}
        />
      </div>
    </div>
  );
  function submit() {
    if (
      ["aero", "res", "weeks", ...outcomes.slice(0, 4)].some(
        (k) =>
          known(f[k + "Min"]) &&
          known(f[k + "Max"]) &&
          +f[k + "Min"] > +f[k + "Max"],
      )
    )
      return setMessage("最小值须小于或等于最大值。");
    if (
      ["aero", "res", "weeks"].some((k) =>
        [f[k + "Min"], f[k + "Max"]].some((x) => known(x) && +x < 0),
      )
    )
      return setMessage("训练时长及周期需要大于或等于零。");
    if (
      [f["胰岛素敏感性Min"], f["胰岛素敏感性Max"]].some(known) &&
      (!f.insMethod.trim() || !f.insUnit.trim())
    )
      return setMessage("请填写胰岛素敏感性的测量方法与单位。");
    apply(f);
  }
  return (
    <Modal
      title="高级筛选"
      subtitle="LITERATURE FILTERS"
      onClose={close}
      footer={
        <>
          <button
            className="btn ghost"
            onClick={() => {
              setF(blankFilters());
              setMessage("");
            }}
          >
            <RotateCcw size={15} />
            重置
          </button>
          <div className="push" />
          {message && (
            <small className="err" role="alert">
              {message}
            </small>
          )}
          <button className="btn primary" onClick={submit}>
            显示 {count(f)} 篇文献
          </button>
        </>
      }
    >
      <div className="modal-scroll">
        <fieldset>
          <legend>文献与研究设计</legend>
          <div className="formgrid">
            {selector("全文获取", "full", accessTypes)}
            {selector("研究设计", "design", designs)}
            {selector("是否为 RCT", "rct", ["是", "否", "待核实"])}
            {selector("RCT 数据可提取性", "raw", rawTypes)}
            {selector("研究人群", "population", [
              "2 型糖尿病",
              "糖尿病前期",
              "1 型糖尿病",
              "混合人群",
              "其他",
              "待核实",
            ])}
            {selector("运动类型", "mode", modes)}
          </div>
        </fieldset>
        <fieldset>
          <legend>运动处方</legend>
          <div className="range-grid">
            {ranged("每周有氧训练", "aero", "min/周")}
            {ranged("每周抗阻训练", "res", "min/周")}
            {ranged("干预周期", "weeks", "周")}
          </div>
          <div className="period-basis">
            <Field label="周期比较口径">
              <Select
                value={f.periodBasis}
                onChange={(v) => set("periodBasis", v)}
                options={["按原文周数", "月数按平均周数换算"]}
              />
            </Field>
          </div>
          {f.periodBasis === "月数按平均周数换算" && (
            <p className="hint">
              按每月约 4.35 周进行比较，原文时长保留在研究记录中。
            </p>
          )}
          <p className="hint">
            <Info size={14} />
            两项剂量需由同一个运动组满足。时长未报告的研究仅参与不限范围的结果。
          </p>
        </fieldset>
        <fieldset>
          <legend>结局指标</legend>
          <p className="field-caption">研究须报告所有已选指标</p>
          <Chips
            options={outcomes}
            value={f.reported}
            set={(v) => set("reported", v)}
          />
          <details className="advanced-details" open={openNumbers || undefined}>
            <summary>按结局数值筛选或设置排序口径</summary>
            <div className="formgrid">
              <Field label="比较时间点">
                <Select
                  value={f.stage}
                  onChange={(v) => set("stage", v)}
                  options={stages}
                />
              </Field>
              <div />
              {ranged("HbA1c", "HbA1c", "%", true)}
              {ranged("FBG", "FBG", "mmol/L", true)}
              {ranged("2hPG", "2hPG", "mmol/L", true)}
              {ranged("胰岛素敏感性", "胰岛素敏感性", "原文单位", true)}
              <Field label="胰岛素敏感性测量方法">
                <input
                  list="ins-methods"
                  placeholder="如 高胰岛素正常血糖钳夹"
                  value={f.insMethod}
                  onChange={(e) => set("insMethod", e.target.value)}
                />
              </Field>
              <Field label="胰岛素敏感性单位">
                <input
                  list="ins-units"
                  placeholder="如 mg/kg FFM/min"
                  value={f.insUnit}
                  onChange={(e) => set("insUnit", e.target.value)}
                />
              </Field>
            </div>
            <datalist id="ins-methods">
              {[
                ...new Set(
                  studies
                    .flatMap((s) =>
                      s.measures
                        .filter((m) => m.outcome === "胰岛素敏感性")
                        .map((m) => m.method),
                    )
                    .filter(Boolean),
                ),
              ].map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <datalist id="ins-units">
              {[
                ...new Set(
                  studies
                    .flatMap((s) =>
                      s.measures
                        .filter((m) => m.outcome === "胰岛素敏感性")
                        .map((m) => m.unit),
                    )
                    .filter(Boolean),
                ),
              ].map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <p className="hint">
              数值取运动组所选时间点的均值。血糖统一按 mmol/L
              比较，胰岛素敏感性只比较指定方法与单位。排序取各研究符合条件组中的最大值，缺失值置后。
            </p>
          </details>
        </fieldset>
        <fieldset>
          <legend>筛选判定</legend>
          <div className="formgrid">
            {selector("偏倚风险", "risk", risks)}
            {selector("Meta 分析纳入资格", "meta", metaTypes)}
            {selector("处理状态", "status", [
              "任一待办",
              ...tasks,
              "可用于Meta分析",
            ])}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}
