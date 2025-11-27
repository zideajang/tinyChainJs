import { ChainNode } from "./chainnode.js";
import { ChainContext } from "./context.js";
import { Tool } from "../tool/index.js";
import { Output } from "./output.js";
import { Message } from "../message/index.js";

// ## ChainState (枚举)
const ChainState = {
  DEFINED: "DEFINED",
  READY: "READY",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

// ## Chain (ChainNode)
class Chain extends ChainNode {
  constructor(name) {
    super({ type: "chain", name: name });
    this.nodes = [];
    this._state = ChainState.DEFINED;
    // 初始化状态转换
  }

  addNode(node) {
    this.nodes.push(node);
    return this; // 支持链式调用
  }

  // Getter/Setter for State to trigger events
  get state() {
    return this._state;
    return this;
  }

  /**
     * 添加分支节点
     * @param {Function} conditionFn - 接收 context，返回 boolean
     * @param {ChainNode} trueNode - true 时执行的节点
     * @param {ChainNode} falseNode - false 时执行的节点 (可选)
     */
  addBranchNode(conditionFn, trueNode, falseNode = null) {
    const branchNode = new ChainNode({ type: "branch", name: "BranchNode" });
    // 重写 invoke 逻辑
    branchNode.invoke = (input, context) => { throw new Error("Branch uses logic internally"); };
    branchNode.async_invoke = async (input, context) => {
      console.log(`[Chain] Evaluating Branch Condition...`);
      const result = await conditionFn(context);
      if (result) {
        console.log(`[Chain] Branch TRUE -> ${trueNode.name}`);
        return await trueNode.async_invoke(input, context);
      } else if (falseNode) {
        console.log(`[Chain] Branch FALSE -> ${falseNode.name}`);
        return await falseNode.async_invoke(input, context);
      }
      return new Output(input, null, { skipped: true });
    };
    this.nodes.push(branchNode);
    return this;
  }


  // 核心执行逻辑


  // 同步 invoke 包装 (在 JS 中通常主要使用 async)
  invoke(input, context) {
    throw new Error("Use async_invoke for Chain execution");
  }

  async async_invoke(input, context = new ChainContext()) {
    if (this.nodes.length === 0) return Output.failure("Chain has no nodes");

    this._state = ChainState.RUNNING;

    // 初始化 Context
    // 如果 input 是对象，合并到 context (除了特定的 prompt 替换)
    if (typeof input === 'object' && input !== null) {
      for (const [k, v] of Object.entries(input)) {
        context.set(k, v);
      }
    }

    let currentInput = input;
    let finalResult = null;

    try {
      for (const node of this.nodes) {

        // 1. 处理上一个节点的输出作为输入
        let nodeInput = currentInput;
        if (currentInput instanceof Output) {
          if (!currentInput.isSuccess) throw new Error(currentInput.error);
          nodeInput = currentInput.content;
        }

        console.log(`[Chain] Running Node: ${node.name} (${node.type})`);

        // 2. 执行节点
        let result = await node.async_invoke(nodeInput, context);

        // --- 3. 工具调用循环 (Agent Loop / ReAct) ---
        // 如果结果包含 tool_calls (Ollama/OpenAI 标准格式)
        // 且 Model 处于 tool 绑定状态，我们需要在这里拦截并执行工具
        while (
          result instanceof Output &&
          result.data &&
          result.data.tool_calls &&
          result.data.tool_calls.length > 0
        ) {
          const toolCalls = result.data.tool_calls;
          console.log(`[Chain] Detected ${toolCalls.length} tool calls.`);

          // 将 Model 的 "Assistant Request" 存入历史
          // 注意：Ollama 返回的 result.data 已经是 message 对象
          context.addMessage(result.data);

          // 遍历执行工具
          for (const call of toolCalls) {
            const toolName = call.function.name;
            const toolArgs = call.function.arguments;

            // 从 Context 中查找工具 (假设 Model 在 bind_tool 时已注册到 context 的 'tool_registry' 或类似机制)
            // 或者简单点，我们假设 Context 里存了 map
            const toolRegistry = context.get("tool_registry") || new Map();
            const toolInstance = toolRegistry.get(toolName);

            let toolOutputContent = "";
            if (toolInstance) {
              console.log(`[Chain] Executing Tool: ${toolName} with args:`, toolArgs);
              const toolRes = await toolInstance.call(toolArgs); // Tool.call 应该支持对象参数
              toolOutputContent = JSON.stringify(toolRes); // 结果必须序列化为字符串
            } else {
              toolOutputContent = `Error: Tool ${toolName} not found.`;
            }

            // 构造 Tool Message
            const toolMessage = {
              role: "tool",
              content: toolOutputContent,
              name: toolName // 有些 API 需要这个
            };
            context.addMessage(toolMessage);
          }

          // 工具执行完后，必须再次调用生成结果的那个 Model 节点，让它基于工具结果生成最终回复
          // 这是一个简化假设：假设 Chain 中只有一个 Model 或者当前 Node 就是 Model
          if (node.type === 'model') {
            console.log(`[Chain] Re-invoking Model with tool results...`);
            // 再次调用 Model，此时 Context 里已经有了 Tool 结果
            result = await node.async_invoke(null, context);
          } else {
            break; // 防止死循环
          }
        }
        // --- 工具循环结束 ---

        currentInput = result;
        finalResult = result;
      }

      this._state = ChainState.COMPLETED;
      return finalResult instanceof Output ? finalResult : new Output(finalResult);

    } catch (e) {
      console.error(e);
      this._state = ChainState.FAILED;
      return Output.failure(e.message);
    }
  }
}

export {
  ChainState,
  Chain
}