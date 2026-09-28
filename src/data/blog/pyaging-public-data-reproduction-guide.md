---
title: "pyaging 生物年龄时钟公开样本实测与复现指南"
pubDatetime: 2026-09-29T00:00:00.000+08:00
modDatetime: 2026-09-29T00:00:00.000+08:00
description: "不用上传个人体检数据，查看 pyaging 在 30 条公开样本上的实际结果，再按步骤复跑并避开数据与模型版本不匹配的问题。"
author: "AI 延续学内容库"
tags:
  - ai-longevity
  - open-source
  - tutorial
featured: true
draft: false
---

想试生物年龄工具，先别把自己的体检单传上去。我们用 [pyaging 官方血液化学教程](https://pyaging.readthedocs.io/en/stable/tutorials/tutorial_bloodchemistry.html)里的 30 条公开 NHANES IV 示例，跑了一次只输出汇总数字的实验。你可以先看结果，再决定要不要自己复跑。这个过程不需要自己的检测数据，也不会给任何人出具生物年龄报告。

我对了[试跑脚本](https://github.com/dongyu19920904/BioAI-Content-Hub/blob/main/automation/projects/pyaging_public_demo.py)和三次 GitHub Actions 记录。前两次失败留下的线索，比一张成功截图更能帮后来的人避坑。

## 先看这次真正跑出的结果

[成功运行记录](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36233207115)里的输入是工具教程使用的 30 条公开样本。脚本固定 `pyaging==0.5.2`，只保存样本数和三个指标的中位数，不导出逐人结果。

| 指标                      | 这批公开样本的输出中位数 | 阅读时要记住                                                 |
| ------------------------- | ------------------------ | ------------------------------------------------------------ |
| PhenoAge                  | 54.64                    | 这是模型分数，未对任何访客做检测                             |
| KDM Age                   | 42.89                    | 与 PhenoAge 用了不同计算方法，两个数不能直接当作疗效前后对比 |
| Homeostatic dysregulation | 3.28                     | 这个指标的数值不能写成“3.28 岁”                              |

这些数字回答的是软件能否在固定示例上跑出结果。它们回答不了某个人还能活多久，也不能证明某种饮食、药物或补剂延长了寿命。想研究模型本身，可以沿着[完整项目页](https://life.aivora.cn/projects/pyaging-public-demo/)查看固定版本、原始代码和运行记录。

## 两次失败发生在哪里

第一次，我们按示例线索取 `v0.3.1` 数据，下载时发现公开样本仓库没有这个标签。[运行记录](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36232565502)是红色的，没有科学结果。第二次改成 `v0.5.2`，样本下来了，三个时钟的权重却没有共同可用的同名标签，[这次也失败了](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36232941434)。

第三次把示例数据和权重固定到共同存在的 `v0.5.1`，软件包仍用 `pyaging==0.5.2`，才得到了上面的聚合输出。[当前自动任务](https://github.com/dongyu19920904/BioAI-Content-Hub/blob/main/.github/workflows/pyaging-public-demo.yml)保留了这组版本，也检查样本必须恰好是 30 条。上游数据或依赖以后若变了，任务会报错，不会临时换一批数据继续给你一个貌似正常的数。

## 没有编程经验，怎样自己复跑

不想操作 GitHub，看到这里和上面的成功记录已经足够了解本次结果。想独立复现，可以照下面的顺序做。我们的仓库是公开的，但访客只有阅读权限，**仅登录 GitHub 后直接打开我们的 Actions 页面，并不会获得“Run workflow”按钮**。GitHub 的[手动运行说明](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)要求仓库写入权限。

1. 登录 GitHub，打开 [BioAI-Content-Hub 仓库](https://github.com/dongyu19920904/BioAI-Content-Hub)，点击右上角 **Fork**，在自己的账号下创建副本。
2. 进入自己副本的 **Actions** 页面。如果 GitHub 提示工作流未启用，先按提示启用。GitHub [默认不会在新 fork 中直接运行工作流](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflows-in-forked-repositories)。
3. 在左侧找到 **Public-data pyaging project demo**，点 **Run workflow**，选择默认分支后运行。只运行这一项即可，不用上传化验单，也不用填 API Key。
4. 等绿色勾出现，打开该次运行底部的 **Artifacts**，下载名称以 `pyaging-public-summary` 开头的文件。里面应看到 `sample_count` 为 30，以及 `clock_results` 下的三个中位数。工件只保留一段时间，过期就重新运行。

如果出现红色叉，先点进失败步骤看是下载、安装还是结果校验出了问题。失败没有可解释的模型结果，不要拿先前的数字冒充这次输出。GitHub 托管运行器使用时间可能受你账号的额度和平台规则影响；这套流程不会占用我们自己的服务器，也不需要你购买检测服务。

## 这篇内容接下来怎么用

对开发者来说，最实在的下一步是把这套固定版本流程在自己的 fork 上跑绿，再研究 pyaging 的[其他时钟和输入格式](https://github.com/lucascamillomd/pyaging)。对普通读者，上面的三个数已经够说明一个边界。公开样本试跑值得学习，拿它给自己算寿命则没有依据。

本站继续记录开源工具的真实安装、输入和失败，已测试与未测试的项目分开放在[研究工具导航](https://life.aivora.cn/projects/open-source-tools/)。本文由 Codex 辅助整理，网站在合并后由 GitHub Actions 自动构建发布。数字、版本与失败经过可沿上面的公开运行记录逐项核对；这是一篇软件复现教程，非医疗建议。
