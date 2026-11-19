"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { seeds } from "../../research/studies";
import { sameStudy, unique, issue } from "../../research/options";
import { studyId } from "../../research/io";
export function useLibrary() {
  const [entries, setEntries] = useState([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const live = useRef([]),
    version = useRef(0);
  const assign = useCallback((arr) => {
    live.current = arr;
    setEntries(arr);
  }, []);
  const refresh = useCallback(async () => {
    const v = version.current;
    try {
      const r = await fetch("/api/workspace", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      if (v === version.current) assign(j.items);
      setReady(true);
      setError("");
      return true;
    } catch (e) {
      setError(e.message || "数据服务暂时不可用");
      return false;
    }
  }, [assign]);
  useEffect(() => {
    refresh();
    const focus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", focus);
    return () => document.removeEventListener("visibilitychange", focus);
  }, [refresh]);
  const write = async (kind, key, value, rev) => {
    if (!ready && !(await refresh()))
      throw new Error("尚未连接到研究库，请先重试。");
    const current = live.current.find((r) => r.kind === kind && r.key === key);
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, key, value, rev: rev ?? current?.rev ?? 0 }),
    });
    const j = await res.json();
    if (!res.ok) {
      if (res.status === 409) await refresh();
      throw new Error(j.error || "保存失败，请重试。");
    }
    version.current++;
    assign([
      ...live.current.filter((r) => !(r.kind === kind && r.key === key)),
      j,
    ]);
    return j;
  };
  const combine = (rows) => {
    const map = new Map(seeds.map((s) => [s.id, s]));
    rows
      .filter((r) => r.kind === "study")
      .forEach((r) => map.set(r.key, r.value));
    return [...map.values()];
  };
  const studies = useMemo(() => combine(entries), [entries]);
  const extensions = useMemo(
    () =>
      Object.fromEntries(
        entries
          .filter((r) => r.kind === "terms")
          .map((r) => [r.key, r.value.words]),
      ),
    [entries],
  );
  const history = useMemo(
    () =>
      entries
        .filter((r) => r.kind === "search")
        .map((r) => ({ ...r.value, id: r.key, rev: r.rev }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );
  const revOf = (kind, key) =>
    live.current.find((r) => r.kind === kind && r.key === key)?.rev || 0;
  const add = async (s) => {
    const list = combine(live.current);
    const prior = list.find((r) => sameStudy(s, r));
    if (prior) {
      const combined = unique([...prior.sources, ...s.sources]);
      if (combined.length === prior.sources.length) return "duplicate";
      await write("study", prior.id, {
        ...prior,
        sources: combined,
        links: [
          ...prior.links,
          ...s.links.filter((l) => !prior.links.some((a) => a.url === l.url)),
        ],
      });
      return "merged";
    }
    const id = await studyId(s);
    const next = { ...s, id };
    const err = issue(next);
    if (err) throw new Error(err);
    await write("study", id, next, 0);
    return "added";
  };
  return {
    studies,
    extensions,
    history,
    ready,
    error,
    refresh,
    revOf,
    write,
    add,
  };
}
