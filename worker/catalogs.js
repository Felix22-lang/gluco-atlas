import { DOMParser } from "@xmldom/xmldom";

const required = {
  "中国知网": ["CNKI_SRU_URL"],
  "维普": ["VIP_SRU_URL"],
  "万方": ["WFDATA_APP_KEY"],
  "Web of Science": ["WOS_API_KEY"],
  "Cochrane Library": ["EBSCO_PROFILE","EBSCO_PASSWORD"],
  "SPORTDiscus": ["EBSCO_PROFILE","EBSCO_PASSWORD"],
};
const list = (el,tag) => Array.from(el.getElementsByTagNameNS("*",tag));
const value = (el,tag) => list(el,tag)[0]?.textContent?.trim() || "";
const str = v => Array.isArray(v) ? v.map(str).join(", ") : typeof v === "string" || typeof v === "number" ? String(v) : v && typeof v === "object" ? str(v.values ?? v.value ?? "") : "";
function url(value) {
  try { const u=new URL(value); return u.protocol==="https:" && !u.username && !u.password ? u.href : ""; } catch { return ""; }
}
function xml(s) {
  if (/<!DOCTYPE/i.test(s)) throw Error();
  return new DOMParser({onError:()=>{throw Error();}}).parseFromString(s,"application/xml");
}
async function read(endpoint,options={}) {
  const response=await fetch(endpoint,{...options,redirect:"error",signal:AbortSignal.timeout(16000)});
  if (!response.ok) throw new Error(response.status===429?"数据库请求限额已到，请稍后再试。":response.status===401||response.status===403?"数据库拒绝本次授权，请核对机构订阅及接口权限。":"数据库接口暂时无法返回结果。");
  return response;
}
async function sru(db,q,page,env) {
  const prefix=db==="维普"?"VIP":"CNKI";
  const endpoint=new URL(env[prefix+"_SRU_URL"]); if(!url(endpoint.href))throw Error();
  // A dedicated collection endpoint defines the source. Keep each generated Chinese phrase together in CQL.
  const cql=q.split(/(\(|\)|\s+(?:AND|OR|NOT)\s+|"[^"]*")/i).map(part=>{
    const t=part.trim(); if(!t||/^(?:[()]|AND|OR|NOT|".*")$/i.test(t))return part;
    return '"'+t.replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"';
  }).join("");
  for(const [k,v] of Object.entries({operation:"searchRetrieve",version:"1.2",query:cql,startRecord:page*20+1,maximumRecords:20,recordSchema:"dc",recordPacking:"xml"}))endpoint.searchParams.set(k,v);
  const token=env[prefix+"_SRU_TOKEN"];
  const doc=xml(await (await read(endpoint,{headers:token?{Authorization:"Bearer "+token}:{}})).text());
  if(list(doc,"diagnostic").length)throw new Error("机构检索网关未接受该检索式或数据库授权。");
  const items=list(doc,"recordData").map(node=>{
    const ids=list(node,"identifier").map(v=>v.textContent.trim());
    const doi=ids.map(i=>i.match(/10\.\d{4,9}\/\S+/i)?.[0]).find(Boolean);
    return {id:ids[0],title:value(node,"title"),authors:list(node,"creator").map(v=>v.textContent).join(", "),year:value(node,"date"),journal:value(node,"source"),url:ids.map(url).find(Boolean),doi};
  });
  return {items,total:value(doc,"numberOfRecords"),provider:db+" · 机构专库"};
}
async function wanfang(q,page,env){
  const resp=await read("https://api.wfdata.com/openwanfang/getQuery",{method:"POST",headers:{"Content-Type":"application/json","X-App-Key":env.WFDATA_APP_KEY},body:JSON.stringify({collections:["OpenPeriodical","OpenThesis","OpenConference"],query:q,rows:20,start:page*20})});
  const data=await resp.json();
  const items=(data.documents??[]).map(d=>{
    const f=Array.isArray(d.fields)?Object.fromEntries(d.fields.map(p=>[p.key,p.value])):d.fields;
    const id=str(f.Id),kind=String(d.resourceType??d.resource_type??"").toLowerCase();
    return {id,title:str(f.Title),year:str(f.PublishYear),authors:str(f.Creator),journal:str(f.PeriodicalTitle)||str(f.Source),doi:str(f.DOI??f.Doi),url:["periodical","thesis","conference"].includes(kind)&&id?"https://d.wanfangdata.com.cn/"+kind+"/"+encodeURIComponent(id):""};
  });
  return {items,total:data.numFound??data.num_found,provider:"万方 · 开放平台"};
}
async function wos(q,page,env){
  const params=new URLSearchParams({db:"WOS",q,page:String(page+1),limit:"20"});
  const d=await (await read("https://api.clarivate.com/apis/wos-starter/v1/documents?"+params,{headers:{"X-ApiKey":env.WOS_API_KEY}})).json();
  return {provider:"Web of Science · 核心合集",total:d.metadata?.total,items:(d.hits??[]).map(h=>({id:h.uid,title:h.title,authors:h.names?.authors?.map(a=>a.displayName).join(", "),year:h.source?.publishYear,journal:h.source?.sourceTitle,doi:h.identifiers?.doi,url:h.links?.record||"https://www.webofscience.com/wos/woscc/full-record/"+encodeURIComponent(h.uid)}))};
}
async function ebsco(db,q,page,env){
  const codes=db==="SPORTDiscus"?(env.SPORTDISCUS_DB==="s3h"?"s3h":"sph"):"cbh,chh";
  const form=new URLSearchParams({prof:env.EBSCO_PROFILE,pwd:env.EBSCO_PASSWORD,authType:"profile",query:q,db:codes,startrec:String(page*20+1),numrec:"20",format:"detailed",sort:"",clusters:"0",subset:"",ipprof:"",orgid:""});
  const response=await read("https://eit.ebscohost.com/Services/SearchService.asmx/Search?"+form);
  const doc=xml(await response.text());
  const scopes=list(doc,"Statistic").map(s=>value(s,"Database").toLowerCase());
  if(!scopes.length||scopes.some(code=>!codes.split(",").includes(code)))throw Error("EBSCO 未确认所选专库范围，请核对 EBSCOhost profile 和数据库订阅。");
  return {provider:db+" · EBSCOhost ("+codes+")",total:value(doc,"Hits"),items:list(doc,"rec").map(n=>{
    const header=list(n,"header")[0],id=header?.getAttribute("an")||value(n,"an"),database=header?.getAttribute("shortDbName")||scopes[0];
    const permalink=id&&codes.split(",").includes(database)?"https://search.ebscohost.com/login.aspx?"+new URLSearchParams({direct:"true",db:database,AN:id,site:"ehost-live"}):"";
    return {id,title:value(n,"atl"),authors:list(n,"au").map(v=>v.textContent).join(", "),journal:value(n,"jtl"),year:list(n,"dt")[0]?.getAttribute("year"),url:value(n,"plink")||permalink,doi:value(n,"doi")};
  })};
}
export async function catalogEndpoint(request,env) {
  const reply=(v,s=200)=>Response.json(v,{status:s,headers:{"Cache-Control":"no-store"}});
  const ready=Object.fromEntries(Object.entries(required).map(([db,keys])=>[db,keys.every(k=>!!env[k])]));
  if(request.method==="GET")return reply({ready});
  if(request.method!=="POST")return reply({error:"请使用 POST 提交检索式。"},405);
  let input;try{input=await request.json();}catch{return reply({error:"检索参数格式错误。"},400);}
  const {db,q,page}=input||{};
  if(!Object.hasOwn(required,db)||typeof q!=="string"||!q.trim()||q.length>23000||!Number.isInteger(page)||page<0||page>499)return reply({error:"请核对数据库、检索式长度与页码。"},400);
  if(!ready[db])return reply({error:db+" 的站内原库接口待授权，可使用下方官网入口。"},503);
  const user=request.headers.get("oai-authenticated-user-id");
  if(!user || !String(env.CATALOG_ALLOWED_USERS||"").split(",").map(v=>v.trim()).includes(user))return reply({error:"请使用获机构授权的本站账号登录。"},403);
  try{
    const res=db==="万方"?await wanfang(q,page,env):db==="Web of Science"?await wos(q,page,env):["中国知网","维普"].includes(db)?await sru(db,q,page,env):await ebsco(db,q,page,env);
    if(res.total==null||res.total===""||!Number.isSafeInteger(Number(res.total))||Number(res.total)<0||res.items.some(i=>!str(i.title).trim())||(!res.items.length&&Number(res.total)>page*20))throw Error();
    return reply({...res,total:Number(res.total),items:res.items.map(i=>({...i,title:str(i.title),year:str(i.year).match(/\d{4}/)?.[0]||"",doi:str(i.doi),url:url(i.url)||url(i.doi&&"https://doi.org/"+i.doi)}))});
  }catch(err){return reply({error:/^(机构检索|EBSCO 未|数据库)/.test(err.message)?err.message:"未取得可核对的题录。请检查接口配置、检索语法或稍后重试。"},502);}
}
