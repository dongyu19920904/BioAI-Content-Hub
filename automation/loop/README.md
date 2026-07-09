# AI 延续学内容自动化 Loop

## 第一阶段：半自动

```powershell
$env:ANTHROPIC_API_URL="https://business.newcli.com"
$env:ANTHROPIC_API_KEY="你的密钥"
$env:DEFAULT_ANTHROPIC_MODEL="claude-sonnet-5"
node automation/loop/generate-draft.mjs --daily daily.md --date 2026-07-09
```

输出：

- `automation/runs/YYYY-MM-DD.md`
- `src/data/blog/generated-YYYY-MM-DD.md`
- `automation/runs/YYYY-MM-DD-resource-pack.md`

人工确认后再提交。

## 第二阶段：全自动

放到 Cloudflare Worker 或 GitHub Actions：

1. 定时读取最新日报。
2. 调用商机筛选器。
3. 调用文章写手。
4. 调用资料包制作器。
5. 提交到 GitHub。
6. GitHub Pages 自动部署。

## 需要的 Secret

- `ANTHROPIC_API_URL`
- `ANTHROPIC_API_KEY`
- `DEFAULT_ANTHROPIC_MODEL`
- `GITHUB_TOKEN`

不要把任何密钥写进仓库。
