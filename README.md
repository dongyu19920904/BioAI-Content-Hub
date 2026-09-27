# AI 延续学内容库

把 AI 延续学商机日报里的灵感，做成文章、资料包、模板和轻工具的独立内容站。

## 站点定位

- 文章库：把日报信号改写成普通人能看懂、能行动的内容。
- 资料包：沉淀清单、表格、话术、提示词和工具导航。
- 自动化：后续接入 AI 筛选、写作、资料包生成和 GitHub 自动发布。
- 变现：先免费验证，跑顺后接 Aivora 小店资料包/兑换码/会员。

## 本地开发

```bash
pnpm install
pnpm build
pnpm dev
```

## 目录

```text
src/data/blog/                 文章内容
src/data/resourcePacks.ts      资料包条目
src/pages/resources/           资料包页面
docs/                          规则、设想和自动化设计
automation/skills/             协作 skills 草案
automation/loop/               自动化 loop 脚本骨架
```

## 计划域名

```text
https://life.aivora.cn
```

## 合规边界

本站内容只做健康信息整理、科普和资料归档，不提供诊断、治疗、用药或抗衰效果承诺。

## 自动化密钥

不要把 API Key 写进仓库。自动化脚本只从环境变量读取：

- `ANTHROPIC_API_URL`
- `RUNTOKEN_API_KEY`（轮换后，仅存私有 Secret；不把聊天中出现过的 Key 用于无人值守任务）
- `DEFAULT_ANTHROPIC_MODEL`
- `DEFAULT_ANTHROPIC_BACKUP_MODEL`
- `GITHUB_TOKEN`
