# scAgeClock 公开样本试跑说明

本项目直接复用 [scAgeClock](https://github.com/gangcai/scageclock/tree/d4ce49daa85b959b537053f35e811017373ec096) 的 BSD-3-Clause 开源软件、仓库自带模型文件和 500 个细胞的公开训练/验证示例。没有接收个人健康数据，也没有改造原模型。

## 已完成的检查

- [GitHub Actions 真实运行 36379154517](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/runs/36379154517) 成功：固定上游提交、CPU 安装、公开样本推理、聚合输出和不含逐细胞字段的工件检查均通过。任务约 1 分 29 秒。
- 输出 `sample_cell_count=500`、`median_model_output=66.14`。这是固定样本与模型的**软件输出**，不是独立模型验证、个人年龄或延寿效果。
- 本地标准库单元测试 2/2 通过，分别检查只导出聚合字段，以及样本规模或数值异常时拒绝产出。

## 如何复跑

在本仓库的 [Public-data scAgeClock project demo](https://github.com/dongyu19920904/BioAI-Content-Hub/actions/workflows/scageclock-public-demo.yml) 页面点击 “Run workflow”。工作流会临时下载固定提交的上游仓库，安装 CPU 依赖，运行 [脚本](../../automation/projects/scageclock_public_demo.py)，并保留 7 天的 `summary.json` 工件。无需提供模型 Key、上传自己的数据或使用自有服务器。

上游样本位于 `data/pytest_data/k_fold_mode/train_val/Fold1/`，模型位于 `data/trained_models/`。示例本身来自训练/验证目录，因此不能用运行成功或这个数值推断泛化性能。工作流不会把逐细胞预测或输入数据上传为本站工件；仅返回七项元数据/聚合结果。上游模型文件使用 PyTorch 权重格式，因此仅在无持久凭据的临时 GitHub 运行器执行指定提交，不在用户电脑或带生产密钥的服务器运行。

若任务变红，先查看安装、上游文件是否仍存在、输出是否恰好 500 条，以及是否出现非有限数值；不要把失败时的空工件改写为成功。医疗、科学和商业需求都需要各自独立核验。
