# 第一个受控开源试跑：pyaging 公开样本

这个工单优先复用[现成的 pyaging 项目](https://github.com/lucascamillomd/pyaging)，不自行发明生物年龄算法。使用 MIT 许可的 `pyaging==0.5.2` 和它提供的 `blood_chemistry_example` 公开 NHANES 样本，在 GitHub Actions 的 CPU 上运行三个时钟，输出仅含样本数和分数中位数的短期工件。依赖、示例数据版本、超时均固定；不占用自己的服务器，不收集用户化验单。

运行入口：GitHub Actions → “Public-data pyaging project demo” → Run workflow。源代码为 `automation/projects/pyaging_public_demo.py`，工作流为 `.github/workflows/pyaging-public-demo.yml`。成功后在该次运行的 Artifacts 下载 `summary.json`；若下载、依赖、输入规模或预测值检查失败，工作流应失败而非制造结果。

这是软件可复现性和开源组合实验，不是临床产品。生物年龄时钟估计不能证明一个人的寿命被延长，也不能据此推荐治疗。公开样本的时钟结果不等于真实用户需求、产品留存或收入；待证明这些指标后才考虑产品化。原项目[使用说明](https://pyaging.readthedocs.io/en/stable/)和[PyPI 版本](https://pypi.org/project/pyaging/)。
