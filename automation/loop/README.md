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

## 证据优先的多渠道内容包（2026-09-26 新链路）

本链路读取日报后端发布的 `schema_version: 1` 机会 JSON，使用同一个 `opportunity_id` 生成站内、公众号、B 站草稿和视频分镜，不依赖模型密钥，也不会自动把草稿当成已发布作品。上面的旧 `generate-draft.mjs` 仍是独立半自动试验，不能代表这条新链路的科学核验结果。

```bash
node automation/loop/build-evidence-packs.mjs --input path/to/opportunity.json
node automation/loop/storyboard-to-hyperframes.mjs automation/runs/YYYY-MM-DD/opp_xxxxxxxxxxxxxxxx/storyboard.json 6
```

输出在被 Git 忽略的 `automation/runs/`：每个机会有 `website.md`、`wechat.md`、`bilibili.md`、`storyboard.json`、`manifest.json`。`manifest.json` 若为 `blocked_from_publication`，就只能作为内部选题草稿；`ready_for_channel_authorization` 也只是具备进一步渠道审核的输入，并不意味着站点、公众号或 B 站已经发布。自动发布必须另外拿到平台授权、真实上传回执和可回查 URL。

`.github/workflows/evidence-pack-daily.yml` 每天北京时间 22:17 尝试读取前端公开仓库同日结构化报告，只将草稿存为短期 GitHub Actions 工件；上游没有 JSON 时明确记缺席。它不会推送网站或发布到社交账号。

视频使用 [HyperFrames](https://github.com/heygen-com/hyperframes) 的 HTML 渲染器。当前程序可产出带时间轴的 `index.html`；已在 Windows 本机通过 `lint` 与 `check`，但本机缺 FFmpeg 且 D 盘空间不足，不能把它写成“本地已出 MP4”。独立的 `video-render-smoke.yml` 在 GitHub 托管运行器用合成样本验证 MP4。合成预览无配音、不是可发布的完整 B 站作品；正式成片仍需对中文配音、字幕、版权、内容事实和渲染成本逐项验证。

`pyaging-voiced-video.yml` 是更进一步的未发布试点：重新运行公开数据上的 pyaging 示例，读取其聚合结果，以 Apache-2.0 的 Kokoro 中文模型配音，由 HyperFrames 生成画面，并烧录字幕，同时生成含源码与复现入口的 B 站说明草稿。它的输出是短期 Actions 工件，**不会上传 B 站或公众号**。自动验收检查六段脚本、音视频轨、时长、字幕、说明链接和“未发布”状态；最终表达质量仍须由人看成片评估。这个试点只演示科研软件，不把生物年龄指标说成真实寿命或疗效。
