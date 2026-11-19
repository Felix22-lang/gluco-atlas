// Europe PMC indexes PubMed records under SRC:MED. Preserve an explicit source label.
export async function searchMedMirror(
  query,
  cursor = "*",
  requestFetch = fetch,
) {
  if (/[\[\]]/.test(query))
    throw new Error(
      "PubMed 暂时没有响应。含有 PubMed 专用字段的检索式可直接打开官网运行。",
    );
  const params = new URLSearchParams({
    query: `SRC:MED AND (${query})`,
    format: "json",
    resultType: "core",
    pageSize: "20",
    cursorMark: cursor || "*",
    sort: "FIRST_PDATE_D desc",
  });
  const long = query.length > 1600;
  const base = "https://www.ebi.ac.uk/europepmc/webservices/rest/";
  const response = await requestFetch(
    base + (long ? "searchPOST" : "search?" + params),
    {
      ...(long ? { method: "POST", body: params } : {}),
      signal: AbortSignal.timeout(9000),
    },
  );
  if (!response.ok) throw new Error("Europe PMC 连接暂不可用。");
  const data = await response.json();
  if (!data.resultList || data.errMsg)
    throw new Error("Europe PMC 未返回有效题录。");
  const items = (data.resultList.result || [])
    .filter((d) => d.pmid)
    .map((d) => ({
      title: d.title.replace(/<[^>]+>/g, ""),
      pmid: d.pmid,
      pmc: d.pmcid || "",
      doi: d.doi || "",
      journal: d.journalInfo?.journal?.title || d.journalTitle || "",
      year: d.pubYear,
      authors: d.authorString || "",
      types: d.pubTypeList?.pubType || [],
    }));
  return {
    total: data.hitCount,
    provider: "Europe PMC · MED",
    cursor: data.nextCursorMark,
    items,
  };
}
