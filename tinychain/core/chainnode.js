
class ChainNode {
  static idCounter = 0;

  constructor({ name, description, type, threadId = null } = {}) {
    this.id = ++ChainNode.idCounter; // 自动生成 ID
    this.threadId = threadId;
    this.name = name || `Node_${this.id}`;
    this.description = description || "";
    this.type = type || "node";
  }

  // 抽象方法
  invoke(input, context = ChainContext.getInstance()) {
    throw new Error("Method 'invoke' must be implemented.");
  }

  // 异步 Invoke
  async async_invoke(input, context = ChainContext.getInstance()) {
    return Promise.resolve(this.invoke(input, context));
  }
}

export {
  ChainNode
}