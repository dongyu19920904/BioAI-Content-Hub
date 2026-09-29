---
title: "scAgeClock 单细胞时钟公开样本复现：500 个细胞跑出了什么"
pubDatetime: 2026-09-29T00:00:00.000+08:00
modDatetime: 2026-09-29T00:00:00.000+08:00
description: "用作者仓库的 500 个公开细胞示例复跑 scAgeClock，查看真实运行记录、输入格式和常见失败点，不上传个人健康数据。"
author: "AI 延续学内容库"
tags:
  - ai-longevity
  - open-source
  - tutorial
featured: true
draft: false
---

手里只有体检报告，想用 scAgeClock 算一个“生物年龄”？先停在下载按钮前。这个项目接收的是单细胞转录组数据，作者的示例输入是 `.h5ad` 文件。常规体检单里的血常规数值不能直接塞进去。想判断工具是否适合自己的数据，可以先看[血液化学数据与单细胞数据选型](https://life.aivora.cn/posts/pyaging-vs-scageclock-input-choice/)；想学会运行软件，则可以用作者公开的样本，不必提交自己的健康信息。

本站把 [scAgeClock 作者仓库的源码固定在 `d4ce49d`](https://github.com/gangcai/scageclock/tree/d4ce49daa85b959b537053f35e811017373ec096)，用其中的 500 个细胞示例和预训练权重，在 GitHub 托管的 CPU 环境复跑。2026 年 9 月 29 日的[成功运行记录](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36552059091)可以公开核对。这里写清楚输入到底是什么、如何自己按按钮复跑，以及结果不能说明什么。

## 输入文件先看清

我们用的是作者仓库中的 [`Pytest_Fold1_200K_chunk27.h5ad`](https://github.com/gangcai/scageclock/blob/d4ce49daa85b959b537053f35e811017373ec096/data/pytest_data/k_fold_mode/train_val/Fold1/Pytest_Fold1_200K_chunk27.h5ad)。[上游 README](https://github.com/gangcai/scageclock/blob/d4ce49daa85b959b537053f35e811017373ec096/README.md)把这个示例描述为 500 个细胞、19,238 个特征的 AnnData 文件，观测信息含 `age`，特征信息含 `feature_id`、`feature_name`。文件在 `k_fold_mode/train_val/Fold1` 下，属于训练/验证示例；它**不是独立测试集**。上游还另有 `train_val_test_mode/test` 路径，不要把两个示例混为一谈。

本次还用到作者仓库的 [`scAgeClock_GMA_model_state_dict.pth`](https://github.com/gangcai/scageclock/blob/d4ce49daa85b959b537053f35e811017373ec096/data/trained_models/scAgeClock_GMA_model_state_dict.pth) 权重。上游文件分别约为 7.9 MiB 和 42.3 MiB。下载量不等于运行内存需求；如果你在自己的电脑运行，还要另算依赖安装和推理占用。示例有文件、元数据和训练时约定的特征，不代表任意 `.h5ad` 文件都能直接套用。上游 README 还要求处理分类字段和基因特征的对应关系；换成自己的研究数据前，应先检查输入格式和模型适用范围。

## 这一次实际得到了什么

本站的[复现脚本](https://github.com/dongyu19920904/BioAI-Content-Hub/blob/main/automation/projects/scageclock_public_demo.py)要求恰好读到 500 行，并检查预测列和真实年龄列存在、模型输出为有限数。成功运行的聚合 JSON 给出的 `sample_cell_count` 是 500，`median_model_output` 是 **66.14**。脚本只保留七个汇总字段，不保存逐细胞编号、逐行预测或原始输入文件。你可以在[项目页](https://life.aivora.cn/projects/scageclock-public-demo/)看结果和代码入口。

**66.14 不是某位访客的生物年龄，更不是寿命预测。**它是模型在作者仓库这批训练/验证示例细胞上的输出中位数。输入来自同一个上游项目，单次跑通只能证明这套固定代码和数据能完成推理，不能替代外部验证，也不能说明干预、药物或补剂延长寿命。

## 不会编程，怎样自己复跑

下面用 GitHub 页面操作，不要求在本机安装 Python。先注册或登录 GitHub，按顺序操作；整个过程使用公开样本，不上传个人检测数据，也不用填写 AI API Key。

1. 打开本站的[公开代码仓库](https://github.com/dongyu19920904/BioAI-Content-Hub)，点右上角 **Fork**，在自己的账号下创建副本。只看原仓库的访客通常不能点运行按钮；[GitHub 的手动运行说明](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)要求对仓库有写入权限。
2. 打开自己副本里的 **Actions**。如果页面提示启用工作流，先阅读提示并启用。[GitHub 对 fork 工作流有默认限制](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflows-in-forked-repositories)，所以创建副本后看不到运行记录不等于脚本坏了。
3. 在左侧选择 **Public-data scAgeClock project demo**，点 **Run workflow**，选择默认分支后确认运行。不要运行名称相近但用途不同的任务。这个流程固定下载上游提交、安装依赖，再运行 500 细胞示例；[任务定义](https://github.com/dongyu19920904/BioAI-Content-Hub/blob/main/.github/workflows/scageclock-public-demo.yml)可供核对。GitHub 托管运行器可能计入你账号当时适用的免费额度或费用规则。
4. 看到绿色勾后，打开本次运行页面底部的 **Artifacts**，下载名称以 `scageclock-public-summary` 开头的文件。解压后看 `sample_cell_count` 是否为 500，`median_model_output` 是否为有限数字，并确认 `upstream_commit` 与本文固定版本一致。工件只保留七天；过期后要重新运行。红色叉没有可用的本次结果，先点进失败步骤检查。

如果运行失败，按失败位置排查。克隆上游失败先看网络和固定提交是否可取；依赖安装失败看 Python、PyTorch 安装步骤；脚本校验失败看样本行数、列名和模型输出。本站任务明确拒绝换用别的上游提交或缺少模型与样本的情况，不会悄悄换一批数据凑出绿色结果。遇到自己看不懂的报错，可以用[中文复现反馈入口](https://github.com/dongyu19920904/BioAI-Content-Hub/issues/new?template=article-reproduction-feedback.md)附上公开运行链接和失败步骤。不要提交个人健康资料、账号密钥或未经检查的完整日志。

这篇教程适合验证开源软件能否在公开示例上运行。如果你要评估自己的单细胞研究数据，下一步先对照[作者仓库的输入说明](https://github.com/gangcai/scageclock/blob/d4ce49daa85b959b537053f35e811017373ec096/README.md)，再设计独立验证；不要从这个示例的中位数推出个人健康结论。本文由 Codex 辅助整理，具体运行和限制均可沿上面的代码、样本与公开记录核对，不提供医疗建议。
