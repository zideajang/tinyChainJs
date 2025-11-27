// ## Memory - 单例且带版本管理
class Memory {
    // 存储唯一的实例
    static instance = null;

    constructor() {
        // 如果实例已存在，则返回现有实例
        if (Memory.instance) {
            return Memory.instance;
        }

        // 核心状态：消息列表
        this.messages = [];
        // 历史记录：存储 messages 每次变更前的状态
        this.history = [];

        // 设置当前实例为唯一的实例
        Memory.instance = this;
    }

    /**
     * 获取 Memory 的唯一实例（单例模式）
     * @returns {Memory} Memory 实例
     */
    static getInstance() {
        if (!Memory.instance) {
            new Memory(); // 如果不存在，则创建新实例 (constructor 会设置 instance)
        }
        return Memory.instance;
    }

    /**
     * 记录当前状态到历史记录中
     * 存储的是当前 messages 数组的深拷贝，以确保历史记录的独立性
     */
    _recordState() {
        // 使用结构化克隆（或 JSON 序列化/反序列化）进行深拷贝
        const stateCopy = JSON.parse(JSON.stringify(this.messages));
        this.history.push(stateCopy);
    }

    /**
     * 添加消息
     * @param {*} message 要添加的消息
     * @param {function} [callback] 可选的回调函数
     */
    addMessage(message, callback = null) {
        this._recordState(); // 记录当前状态
        this.messages.push(message);
        if (callback) callback(this.messages);
    }

    /**
     * 插入消息
     * @param {number} index 插入位置的索引
     * @param {*} message 要插入的消息
     * @param {function} [callback] 可选的回调函数
     */
    insertMessage(index, message, callback = null) {
        this._recordState(); // 记录当前状态
        this.messages.splice(index, 0, message);
        if (callback) callback(this.messages);
    }

    /**
     * 删除消息
     * @param {number} index 要删除消息的索引
     * @param {function} [callback] 可选的回调函数
     */
    deleteMessage(index, callback = null) {
        if (index < 0 || index >= this.messages.length) {
             // 索引无效，不执行操作，也不记录状态
             if (callback) callback(this.messages);
             return;
        }
        this._recordState(); // 记录当前状态
        this.messages.splice(index, 1);
        if (callback) callback(this.messages);
    }

    /**
     * 撤销上一次操作（回退到上一个版本）
     * @param {function} [callback] 可选的回调函数
     * @returns {boolean} 是否成功回退
     */
    undo(callback = null) {
        if (this.history.length === 0) {
            console.warn("无法撤销：没有历史版本记录。");
            if (callback) callback(this.messages);
            return false;
        }

        // 取出上一个历史状态
        const previousState = this.history.pop();
        // 恢复状态
        this.messages = previousState;

        if (callback) callback(this.messages);
        return true;
    }
    
    // --- 原始的其他方法保持不变，但无需记录状态（因为它们是查询或模拟 I/O） ---

    load(callback) {
        // 模拟从某处加载
        if (callback) callback(this.messages);
        return this.messages;
    }

    save(callback) {
        // 如果需要保存历史记录，可以在这里添加逻辑
        if (callback) callback(this.messages);
    }

    filter(callback) {
        return callback(this.messages);
    }
}

// 导出单例获取方法，而不是类本身（更符合单例的使用习惯）
const memoryInstance = Memory.getInstance();

export {
    memoryInstance as Memory
}