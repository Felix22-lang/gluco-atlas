# 糖动研库 · Gluco Atlas

用于持续检索、筛选和提取糖尿病及糖尿病前期运动干预研究的中文工作台。适合记录一项联合训练研究中每周有氧与抗阻训练的分钟数，并回到原文核对各组的 HbA1c 等结局。

## 在自己的电脑运行

准备 Git 和 Node.js 22.13 或以上版本。下载仓库 ZIP 并解压，或用 Git 克隆仓库，然后在含有 `package.json` 的目录中打开终端。仅下载 ZIP 时无需安装 Git。

```sh
npm ci
npm run dev
```

打开 [http://127.0.0.1:5173](http://127.0.0.1:5173)。首次启动会创建本地数据库，后续启动会使用已保存的研究记录。Windows 可使用命令提示符运行上述命令。在终端按 `Ctrl+C` 即可停止。

## 做一次文献筛选

1. 在「跨库检索」选择数据库。PubMed 支持站内查询、翻页和入库，也可使用带 PMID 的 Europe PMC 题录。中国知网、万方、维普、Web of Science、Cochrane Library 和 SPORTDiscus 提供官网检索入口及可复制的布尔检索式。订阅数据库的访问权限由所在机构提供。
2. 在「添加文献」导入 RIS、NBIB、EndNote、RefWorks 或应用导出的 JSON。系统按 PMID、DOI 和规范化题名识别重复研究，补充题录来源。
3. 在「文献工作台」按公开 PDF、可提取 RCT 数据、研究设计、运动类型、周剂量、周期、结局、偏倚风险和 Meta 资格筛选。若同时限定有氧和抗阻分钟数，两项须在同一运动组满足。
4. 打开研究的「数据提取」，记录分组、时间点、单位、样本量、均值、SD、SE 或置信区间及原文表号。「筛选判定」可标记待下载、待提取与 Meta 纳入资格。使用「导出结果」生成当前筛选结果的 CSV 长表或 JSON。

开箱包含 13 条已发表研究的题录及部分可核对的分组统计量。点击研究卡片上的公开 PDF 或 DOI 可查看原始出版物。Meta 分析资格取决于具体研究方案。

## 关键词与研究数据

公开基础词表在 `research/default-terms.json`。可以直接在界面添加个人扩展词。如果使用已有的完整检索框架，可复制该 JSON 为 `local/keywords.json`，保留其中五个字符串数组，并替换词条。重新启动后会使用这份本地词表。「完整关键词框架」预设会合并基础词和个人扩展词。

本机数据保存在 `.wrangler/state/`。如需完整备份，先停止应用，再备份该目录和自定义的 `local/keywords.json`。这些目录已被 Git 忽略。发布构建会将选用的基础词表打包进网页，请在构建可公开分享的版本时使用公开词表。

## 开发

```sh
npm run typecheck
npm run build
```

前端使用 React 和 Vinext，后端通过 Cloudflare Worker 处理 `/api/pubmed` 和 `/api/workspace`，D1 保存逐条修改并检查版本冲突。`app/ui/` 为工作台界面，`research/` 为筛选、导入导出、检索式与公开研究数据，`worker/` 为接口，`drizzle/` 为数据库迁移。

本机启动默认监听回环地址，供单人使用。要部署为托管应用，需要配置 D1 和可信身份网关。本仓库提供未绑定项目的 Sites 配置。使用 Sites 私有托管时，在自己的项目中绑定 `DB` 并让 Sites 注入认证身份。其他托管平台需要接入自己的身份验证。GitHub Pages 单独托管静态页面无法运行这些后端接口。

## 许可与来源

本项目代码和随附界面素材按 [MIT License](LICENSE) 发布。随附的 Sites 构建插件保留[上游 MIT 许可](scripts/vite/sites-vite-plugin.LICENSE)，各 npm 依赖使用各自许可证。示例题录、数值和出处见 `research/studies.js`。论文全文均链接至出版方或公开文献库，全文与外部数据集的再利用遵循各自的许可。

## 跨库检索配置

跨库检索页读取各专库的连接状态。服务端调用使用 Sites 环境变量，密钥设为 Secret。授权检索仅向 `CATALOG_ALLOWED_USERS` 中逗号分隔的已登录账号 ID 开放。按照机构许可填写。配置后重新部署版本。

| 数据库 | 服务端设置 | 检索范围 |
|---|---|---|
| 万方 | WFDATA_APP_KEY | 开放平台的期刊、学位与会议 |
| Web of Science | WOS_API_KEY | Starter API 核心合集 |
| SPORTDiscus | EBSCO_PROFILE、EBSCO_PASSWORD；SPORTDISCUS_DB 可填 s3h（默认 sph） | EBSCOhost 非 Discovery profile，限定体育库 |
| Cochrane Library | 同一 EBSCOhost profile 需有 cbh 和 chh 权限 | CENTRAL 与 CDSR；另有无需授权的 PubMed / Europe PMC 收录的 CDSR 期刊检索 |
| 中国知网、维普 | CNKI_SRU_URL、VIP_SRU_URL；如需 Bearer 验证分别配置 CNKI_SRU_TOKEN、VIP_SRU_TOKEN | 仅支持机构提供的、明确限定该库的 HTTPS SRU 1.2 网关，需支持 CQL、DC/XML 及按页取数。普通数据库主页或跨库发现服务 URL 无法替代专库端点。 |

检索结果保存原库、题名、标识符和提供的原文链接。接口访问失败不会记录为零命中。外部官网检索受数据库登录状态及搜索框语法影响；系统综述应核对官网执行的检索式。
