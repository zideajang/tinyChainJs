import { Tool } from "../tool/index.js";


class ChainContext {
  constructor() {
    if (ChainContext.instance) {
      return ChainContext.instance;
    }
    this.store = new Map();
    this.history = []; // 记录 Context 版本
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    // 记录版本 (简单深拷贝保存快照)
    this.saveVersion();
    this.store.set(key, value);
  }

  getMessages() {
    return this.get("messages") || [];
  }

  addMessage(message) {
    const msgs = this.getMessages();
    // 确保是新数组引用
    this.set("messages", [...msgs, message]);
  }

  saveVersion() {
    // 注意：生产环境需要更高效的 immutable 数据结构
    const snapshot = new Map(this.store);
    this.history.push({
      timestamp: Date.now(),
      data: snapshot
    });
  }
  
  getAll() {
      return Object.fromEntries(this.store);
  }

  static getInstance() {
    if (!ChainContext.instance) {
      ChainContext.instance = new ChainContext();
    }
    return ChainContext.instance;
  }
}


export {
    ChainContext
}