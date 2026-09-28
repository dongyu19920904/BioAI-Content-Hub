---
title: "血液化学数据还是单细胞数据：pyaging 与 scAgeClock 怎么选"
pubDatetime: 2026-09-29T00:00:00.000+08:00
modDatetime: 2026-09-29T00:00:00.000+08:00
description: "按输入数据、复现门槛与实测范围选择两个开源衰老研究工具；附公开样本运行记录和免费仓库初筛入口。"
author: "AI 延续学内容库"
tags:
  - ai-longevity
  - open-source
  - tutorial
featured: false
draft: false
---

有人找到“生物年龄开源工具”就想下载安装，跑到输入数据这一步才发现，自己手里的表格，和程序要的矩阵不是一回事。选 pyaging 还是 scAgeClock，先看数据，不要先看演示图里的年龄数字。

我们核对了两个项目的官方说明，并分别用作者提供的公开示例在 GitHub 托管 CPU 上跑通。下面只讨论**这两条已试跑路径**，不替任何人的检测报告选择模型，也不比较两种时钟谁更准。

| 先看什么       | pyaging 已试跑的血液化学路径                                                                                                                                         | scAgeClock 已试跑的单细胞路径                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 公开输入       | [官方血液化学教程](https://pyaging.readthedocs.io/en/stable/tutorials/tutorial_bloodchemistry.html)使用 NHANES IV 的 30 条示例记录；转换前是表格，示例显示 16 个字段 | [作者仓库](https://github.com/gangcai/scageclock)提供 500 个细胞的 `.h5ad` 示例；文档列出 19,238 个特征，包含类别字段与基因特征 |
| 已跑过的任务   | 固定 `pyaging==0.5.2`，示例数据与权重固定 `v0.5.1`，运行 PhenoAge、KDM Age、Homeostatic dysregulation                                                                | 固定源码提交 `d4ce49d`，用仓库内预训练模型对 500 细胞示例推理；这份输入来自训练/验证目录，不是独立测试集                        |
| 本站保留的结果 | 只导出 30 条样本的三个中位数及版本，不公开逐人预测                                                                                                                   | 只导出细胞数与模型输出中位数，不公开逐细胞预测                                                                                  |
| 先别做什么     | 不要把个人化验单传到公开 Issue，也不要把不同指标的数字互当“年轻了几岁”                                                                                               | 不要把普通表格改名为 `.h5ad` 就送进去；输入需要符合项目的特征顺序和类别编码                                                     |

如果只是想学习“从公开数据到一个可复核输出”，从 [pyaging 的中文复现指南](/posts/pyaging-public-data-reproduction-guide/)开始，能看到我们第一次找不到数据标签、第二次权重标签不匹配、第三次才跑通的全过程。[成功运行记录](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36233207115)和[固定脚本](https://github.com/dongyu19920904/BioAI-Content-Hub/blob/main/automation/projects/pyaging_public_demo.py)都公开。PhenoAge 中位数是 54.64，KDM Age 是 42.89，Homeostatic dysregulation 是 3.28；最后一个数**不是岁数**，三个值也不能互相当成疗效对照。

如果研究任务本来就是单细胞转录组，才看 [scAgeClock 项目页](/projects/scageclock-public-demo/)和[它的官方输入格式说明](https://github.com/gangcai/scageclock#information-about-scageclocks-input-dataset)。我们在[这次成功运行](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36379154517)里得到 500 细胞、模型输出中位数 66.14。这个数来自项目自带的训练/验证示例，不能拿来证明模型在独立人群上准确，更不能与上面的 54.64 相减。手里若已有自己的 `.h5ad`，先对照作者文档检查特征、类别编码和模型文件；本站的试跑**没有**验证私人数据接入。

## 五分钟决定下一步

1. **先辨认数据。** 是结构化血液化学研究数据，还是单细胞表达矩阵？两者都没有，就先读公开样本，不急着上传或购买检测。
2. **用公开示例复跑。** pyaging 按[这篇指南](/posts/pyaging-public-data-reproduction-guide/)在自己的 GitHub Fork 里启用 Actions、运行工作流、下载汇总工件；scAgeClock 按[项目页](/projects/scageclock-public-demo/)找到另一条同名任务。只登录原仓库的访客没有手动运行权限。
3. **看失败在哪一步。** 下载失败先查固定标签；安装失败看依赖；输入校验失败看字段、单位或 `.h5ad` 格式。红色运行记录没有模型结论，不能拿上一次的数补上。
4. **换别的仓库时，先查元数据。** 如果你找到一个更贴合任务的公开 GitHub 项目，可以提交[免费公开仓库初筛](/services/repo-preflight/)。机器人会回仓库是否归档、GitHub 识别的许可、README 与最近维护时间。它**不会**下载或运行对方代码，也不会评价科学效果；请勿提交个人健康信息或密钥。

这两次测试证明固定软件、公开输入与托管运行环境能走完一条软件流程。它们既不是临床验证，也没有证明真实延寿。真正要把工具用于研究，仍要检查数据适配、模型适用范围、独立验证和许可证；我们目前没有做这些项目的用户数据服务。

来源与复核可见 [pyaging 官方血液化学教程](https://pyaging.readthedocs.io/en/stable/tutorials/tutorial_bloodchemistry.html)、[scAgeClock 官方仓库与输入说明](https://github.com/gangcai/scageclock)、[pyaging 运行](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36233207115)和[scAgeClock 运行](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36379154517)。本文由 Codex 协助核对和写作，数字均指公开示例的聚合输出；非医疗建议。发现复现步骤不对，可用[中文反馈表](https://github.com/dongyu19920904/BioAI-Content-Hub/issues/new?template=article-reproduction-feedback.md)指出具体步骤与公开运行链接。
