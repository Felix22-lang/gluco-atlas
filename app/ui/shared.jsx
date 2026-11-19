"use client";
import { useEffect, useId, useRef } from "react";
import {
  X,
  FileText,
  ClipboardCheck,
  FlaskConical,
  BookOpen,
  Check,
  ChevronDown,
} from "lucide-react";
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
  footer,
  className = "",
}) {
  const box = useRef(null),
    close = useRef(onClose),
    uid = useId();
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.focus();
    function handle(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const items = [
          ...box.current.querySelectorAll(
            'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
          ),
        ].filter((el) => el.offsetParent !== null);
        if (!items.length) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === items[0] ||
            document.activeElement === box.current)
        ) {
          e.preventDefault();
          items.at(-1).focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === items.at(-1) ||
            document.activeElement === box.current)
        ) {
          e.preventDefault();
          items[0].focus();
        }
      }
    }
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handle);
      previous?.focus?.();
    };
  }, []);
  return (
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={"modal " + (wide ? "wide " : "") + className}
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={uid}
      >
        <div className="modal-head">
          <div>
            {subtitle && <div className="eyebrow">{subtitle}</div>}
            <h2 id={uid}>{title}</h2>
          </div>
          <button
            className="icon-btn close"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </section>
    </div>
  );
}
export function Field({ label, children, wide = false, note }) {
  return (
    <label className={"field " + (wide ? "span2" : "")}>
      <span>{label}</span>
      {children}
      {note && <small>{note}</small>}
    </label>
  );
}
export function Select({
  value,
  onChange,
  options,
  all = false,
  placeholder = "全部",
  ...props
}) {
  return (
    <span className="select-wrap">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {all && <option value="">{placeholder}</option>}
        {options.map((v) =>
          Array.isArray(v) ? (
            <option key={v[0]} value={v[0]}>
              {v[1]}
            </option>
          ) : (
            <option key={v} value={v}>
              {v}
            </option>
          ),
        )}
      </select>
      <ChevronDown size={14} />
    </span>
  );
}
export function Chips({ options, value, set }) {
  return (
    <div className="chip-options">
      {options.map((k) => (
        <button
          type="button"
          key={k}
          aria-pressed={value.includes(k)}
          className={"option-chip " + (value.includes(k) ? "on" : "")}
          onClick={() =>
            set(
              value.includes(k) ? value.filter((v) => v !== k) : [...value, k],
            )
          }
        >
          {value.includes(k) && <Check size={12} />} {k}
        </button>
      ))}
    </div>
  );
}
export function SectionHead({ icon: Icon, title, children }) {
  return (
    <div className="section-heading">
      <div>
        {Icon && <Icon size={19} />}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function StudyTags({ s, compact = false }) {
  return (
    <span className="tags">
      {s.access === "公开 PDF" && s.pdf && (
        <a
          className="tag pdf"
          href={s.pdf}
          target="_blank"
          rel="noreferrer"
          title="打开公开 PDF"
        >
          <FileText />
          公开 PDF
        </a>
      )}
      {s.rct === "是" && (
        <span className="tag rct">
          <FlaskConical />
          RCT
        </span>
      )}
      {s.raw === "可提取" && s.rct === "是" && (
        <span className="tag raw">
          <ClipboardCheck />
          数据可提取
        </span>
      )}
      {s.rct === "否" && s.design.includes("综述") && (
        <span className="tag review">
          <BookOpen />
          系统综述
        </span>
      )}
      {s.meta === "可用于Meta分析" && (
        <span className="tag raw">Meta 可纳入</span>
      )}
      {!compact && s.access !== "公开 PDF" && (
        <span className="tag neutral">
          {s.access === "待核实" ? "全文待核实" : s.access}
        </span>
      )}
    </span>
  );
}
export function Empty({ icon: Icon = BookOpen, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function changeIn(list, index, field, value) {
  return list.map((item, i) =>
    i === index ? { ...item, [field]: value } : item,
  );
}
export const toggleValue = (list, value) =>
  list.includes(value) ? list.filter((i) => i !== value) : [...list, value];
