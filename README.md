
---
<div align="center">

## ✨ tinyChain (JavaScript Version)

### 🚀 核心目标：极简、实用、灵活的 AI 工作流框架

</div>


tinyChain 的设计哲学围绕三个核心关键词展开：**小巧（Tiny）**、**实用（Ground-Up）**和**灵活（Flexible）**。

我们的愿景是打造一个从**实际应用落地**出发、**不做多余加法**的轻量级 AI 编排框架。在能高效满足业务场景需求的前提下，我们尽力做到**极简设计**，彻底抛弃复杂性带来的不确定性和维护成本。

---

### 💡 设计理念：大道至简，确定性流程驱动

#### **名字由来：Tiny + Chain**
* **Chain（链）**: 代表任务流程的**自动化**和**确定性执行**。
* **Tiny（极简）**: 强调框架的**轻量级设计**和**极简集成**。
tinyChain 致力于提供一种**清晰、可预测**的 AI 工作流解决方案。

#### **Chain 的确定性原则**
* **流程固定**：一旦 Chain 被定义，其内部的节点（Node）和执行路径就相对固定，流程呈现**线性**或**明确分支**的结构。
* **避免 LLM 决策**：Chain 本身被设计为**执行器**而非**规划器**。它**不具备**依赖 LLM 进行复杂的**规划或推理**来动态决定下一步流程的能力。这种设计确保了流程的**稳定性和可预测性**。

---

### 🛠️ 框架特征 (Features)

| 特征 | 描述 | 优势 |
| :--- | :--- | :--- |
| **Zero Dependency** | 框架核心**无额外依赖**，体积轻巧。 | 确保极速安装、最小化依赖冲突和打包体积。 |
| **Seamless Integration** | **无缝接入**现有 JavaScript/Node.js 生态系统。 | 快速 POC 和项目迁移，无需进行大规模架构调整。 |
| **Localized LLM Support** | 深度支持国内主流模型：**通义千问 (Qwen)** 和 **DeepSeek** 系列。 | 更好地服务国内开发者和企业应用场景。 |
| **Local Deployment Ready** | 原生支持 **Ollama** 等**本地部署**模型。 | 满足数据安全、离线环境及成本控制的需求。 |
| **Excellent Extensibility** | 模块化设计，具备**良好的扩展性**。 | 方便用户自定义 Node、接入新模型或第三方服务。 |

---

### ✅ 核心能力 (Capabilities)

* **轻松定义确定性任务流**
    * 通过简洁的 API 快速构建**线性任务**流程。
* **强大的结构化输出**
    * 原生支持 **JSON**、**Structure** 等格式的输出，确保模型返回结果可直接用于后续程序处理。
* **灵活的工具调用 (Tool Calling)**
    * 提供多种灵活的工具接入方式，实现 LLM 与外部系统和 API 的交互。
* **DSL (领域特定语言) 支持**
    * 提供一种**声明式**语言或配置方式，进一步简化复杂 Chain 的定义和管理。

---

### 📂 示例展示 (Examples)

* **Hello World**: 基础 Chain 运行流程。
* **工具调用**: 实现模型查询天气、调用数据库等外部功能。
* **结构化输出**: 实现用户评论的情感分析，并输出标准化 JSON 对象。
* **数据处理**: 实现复杂文档的抽取、转换和加载 (ETL) 流程。

---

### 安装
需要先安装 `rollup`

```powershell
npm run build
```
安装项目

```javascript
import { Chain,Prompt,Model } from "../dist/tinychain.esm.js";


const simple_chain = new Chain("simple chain")
const model = new Model();
simple_chain.addNode(model)
const result = await simple_chain.async_invoke("天空为什么是蓝色")
```
---
### 🔗 Chain 与 Agent：明确的定位与关系

| 对比维度 | tinyChain (Chain) | Agent (智能体) |
| :--- | :--- | :--- |
| **核心能力** | **执行 (Execution)** | **规划 (Planning) & 推理 (Reasoning)** |
| **流程结构** | **确定性**、预定义、固定路径、线性或固定分支。 | **非确定性**、动态决策、基于 LLM 的自主思考和工具选择。 |
| **设计目标** | **高效、稳定、可预测**地完成固定流程任务。 | **智能、灵活**地解决开放式、复杂问题。 |
| **tinyChain 定位** | tinyChain 定位为**高效的流程自动化引擎**，它是更复杂的 Agent 应用中不可或缺的**基础执行模块**。您可以将多个 tinyChain 组合起来，作为 Agent 的特定“子工具”或“原子能力”来使用。 |


### 实例