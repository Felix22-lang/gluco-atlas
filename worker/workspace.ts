import { catalogEndpoint } from "./catalogs.js";
import { searchMedMirror } from "../research/pubmed-mirror.js";
const respond = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const kinds = new Set(["study", "terms", "search"]);
const tags = new Set([
  "exerciseZh",
  "exerciseEn",
  "glucoseZh",
  "glucoseEn",
  "designZh",
]);

async function pubmed(term: string, start: number) {
  const base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  const params = new URLSearchParams({
    db: "pubmed",
    term,
    retmode: "json",
    retmax: "20",
    retstart: String(start),
    sort: "pub date",
    tool: "GlucoAtlas",
  });
  const first = await fetch(
    base + "esearch.fcgi" + (term.length < 1200 ? "?" + params : ""),
    term.length < 1200
      ? { signal: AbortSignal.timeout(12000) }
      : { method: "POST", body: params, signal: AbortSignal.timeout(12000) },
  );
  if (!first.ok) throw new Error("pubmed");
  const search = ((await first.json()) as any).esearchresult;
  if (!search || !Array.isArray(search.idlist) || search.ERROR)
    throw new Error("pubmed");
  if (!search.idlist.length)
    return respond({
      total: Number(search.count) || 0,
      items: [],
      start,
      provider: "PubMed",
    });
  const summaries = await fetch(
    base +
      "esummary.fcgi?" +
      new URLSearchParams({
        db: "pubmed",
        id: search.idlist.join(","),
        retmode: "json",
        tool: "GlucoAtlas",
      }),
    { signal: AbortSignal.timeout(12000) },
  );
  if (!summaries.ok) throw new Error("pubmed");
  const docs = ((await summaries.json()) as any).result;
  if (!docs?.uids) throw new Error("pubmed");
  const items = docs.uids.map((id: string) => {
    const d = docs[id];
    const doi = d.articleids?.find((v: any) => v.idtype === "doi")?.value || "";
    const pmc = d.articleids?.find((v: any) => v.idtype === "pmc")?.value || "";
    return {
      pmid: id,
      title: d.title.replace(/<[^>]+>/g, ""),
      journal: d.fulljournalname || d.source,
      authors: (d.authors || []).map((a: any) => a.name).join(", "),
      year: d.pubdate?.match(/\d{4}/)?.[0] || "",
      doi,
      pmc,
      types: d.pubtype || [],
    };
  });
  return respond({
    total: Number(search.count),
    items,
    start,
    provider: "PubMed",
  });
}

export async function handleWorkspace(request: Request, env: Cloudflare.Env) {
  const path = new URL(request.url).pathname;
  if (path === "/api/catalogs") {
    const trusted = __GLUCO_SITES_GATEWAY__ || (import.meta.env.DEV && ["127.0.0.1","localhost","[::1]"].includes(new URL(request.url).hostname));
    if (!trusted && request.method !== "GET") return respond({error:"机构检索需要配置可信身份网关。"},403);
    const req = new Request(request);
    if (!__GLUCO_SITES_GATEWAY__) req.headers.set("oai-authenticated-user-id","local-researcher");
    return catalogEndpoint(req,env);
  }
  if (path === "/api/pubmed") {
    if (!["GET", "POST"].includes(request.method))
      return respond({ error: "不支持的操作" }, 405);
    let params;
    try {
      params =
        request.method === "POST"
          ? ((await request.json()) as Record<string, string>)
          : Object.fromEntries(new URL(request.url).searchParams);
    } catch {
      return respond({ error: "无效的检索参数" }, 400);
    }
    const term = String(params.q || "").trim();
    if (!term || term.length > 23000)
      return respond(
        { error: "请填写有效的检索式（最多 23000 个字符）。" },
        400,
      );
    const start = Math.max(
      0,
      Math.min(9980, Number.parseInt(params.start || "0", 10) || 0),
    );
    if (params.provider !== "mirror") {
      try {
        return await pubmed(term, start);
      } catch {
        /* A MED-only mirror also serves public PubMed records. */
      }
    }
    try {
      return respond(await searchMedMirror(term, params.cursor || "*"));
    } catch {
      return respond(
        { error: "文献接口暂未响应，可打开官网运行当前检索式。" },
        502,
      );
    }
  }
  const url = new URL(request.url);
  const isLocal = import.meta.env.DEV && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  const owner = isLocal ? "local-researcher" : __GLUCO_SITES_GATEWAY__
    ? request.headers.get("oai-authenticated-user-id")
    : null;
  if (!owner) return respond({ error: "请在本机打开应用，或通过已配置身份验证的 Sites 工作区登录。" }, 401);
  if (path !== "/api/workspace") return respond({ error: "页面不存在" }, 404);
  const db = env.DB;
  if (!db) return respond({ error: "数据服务暂不可用，请稍后重试。" }, 503);
  try {
    if (request.method === "GET") {
      const { results } = await db
        .prepare(
          "SELECT kind,entry_key,revision,payload,updated_at FROM workspace_entries WHERE owner=? ORDER BY updated_at",
        )
        .bind(owner)
        .all<{
          kind: string;
          entry_key: string;
          revision: number;
          payload: string;
          updated_at: string;
        }>();
      return respond({
        items: results.map((r) => ({
          kind: r.kind,
          key: r.entry_key,
          rev: r.revision,
          value: JSON.parse(r.payload),
          updated: r.updated_at,
        })),
      });
    }
    if (request.method !== "POST")
      return respond({ error: "不支持的操作" }, 405);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return respond({ error: "需要 JSON 请求" }, 415);
    const raw = await request.text();
    if (raw.length > 1200000)
      return respond({ error: "此记录超过大小限制，请拆分后重试。" }, 413);
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return respond({ error: "数据格式无效" }, 400);
    }
    const { kind, key, rev, value } = data;
    if (
      !kinds.has(kind) ||
      typeof key !== "string" ||
      key.length < 1 ||
      key.length > 180 ||
      !Number.isSafeInteger(rev) ||
      rev < 0 ||
      !value ||
      typeof value !== "object"
    )
      return respond({ error: "记录格式无效" }, 400);
    if (
      kind === "study" &&
      (value.id !== key ||
        typeof value.title !== "string" ||
        !value.title.trim() ||
        ![
          "sources",
          "arms",
          "measures",
          "links",
          "tasks",
          "reported",
          "modes",
        ].every((k) => Array.isArray(value[k])))
    )
      return respond({ error: "文献字段不完整" }, 400);
    if (
      kind === "terms" &&
      (!tags.has(key) ||
        !Array.isArray(value.words) ||
        value.words.some((v: unknown) => typeof v !== "string"))
    )
      return respond({ error: "关键词格式无效" }, 400);
    if (
      kind === "search" &&
      (typeof value.query !== "string" ||
        !value.query.trim() ||
        typeof value.db !== "string")
    )
      return respond({ error: "检索记录缺少检索式或来源" }, 400);
    const updated = new Date().toISOString(),
      payload = JSON.stringify(value);
    const action =
      rev === 0
        ? db
            .prepare(
              "INSERT INTO workspace_entries(owner,kind,entry_key,revision,payload,updated_at) VALUES(?,?,?,1,?,?) ON CONFLICT DO NOTHING",
            )
            .bind(owner, kind, key, payload, updated)
        : db
            .prepare(
              "UPDATE workspace_entries SET payload=?,updated_at=?,revision=revision+1 WHERE owner=? AND kind=? AND entry_key=? AND revision=?",
            )
            .bind(payload, updated, owner, kind, key, rev);
    const result = await action.run();
    if (result.meta.changes !== 1)
      return respond(
        { error: "这条记录已在其他窗口更新。请重新打开最新记录后保存。" },
        409,
      );
    return respond({ kind, key, value, rev: rev + 1, updated });
  } catch {
    return respond({ error: "记录暂时无法读写，请稍后重试。" }, 503);
  }
}
