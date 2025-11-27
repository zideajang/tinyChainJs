/**
 * Output 类：用于封装 ChainNode 异步执行的结果。
 * 它在链中的节点之间传递，携带成功内容 (content/data) 或错误信息 (error)。
 */
class Output {
    /**
     * 构造函数
     * @param {*} content - 成功执行后的主要结果内容 (例如：字符串、对象、数字)。
     * @param {string|null} error - 如果执行失败，则为错误消息。
     * @param {object|null} data - 额外的元数据或上下文数据。
     */
    constructor(content = null, error = null, data = null) {
        this._content = content;
        this._error = error;
        this._data = data;
        
        // 衍生属性：快速判断是否成功
        this._isSuccess = !error;
    }

    // --- Getter 方法 ---
    
    /**
     * 获取主要内容
     * @returns {*}
     */
    get content() {
        return this._content;
    }

    /**
     * 获取辅助数据
     * @returns {object|null}
     */
    get data() {
        return this._data;
    }

    /**
     * 获取错误信息
     * @returns {string|null}
     */
    get error() {
        return this._error;
    }

    /**
     * 检查操作是否成功
     * @returns {boolean}
     */
    get isSuccess() {
        return this._isSuccess;
    }

    // --- 静态工厂方法 (可选，但推荐) ---

    /**
     * 创建一个成功的 Output 实例
     * @param {*} content 
     * @param {object|null} data 
     * @returns {Output}
     */
    static success(content, data = null) {
        return new Output(content, null, data);
    }

    /**
     * 创建一个失败的 Output 实例
     * @param {string} errorMsg 
     * @param {object|null} data 
     * @returns {Output}
     */
    static failure(errorMsg, data = null) {
        return new Output(null, errorMsg, data);
    }

    // --- 辅助方法 (可选) ---

    /**
     * 将 Output 转换为简洁的 JSON 对象（便于日志或外部传输）
     * @returns {object}
     */
    toJSON() {
        return {
            isSuccess: this.isSuccess,
            content: this.content,
            error: this.error,
            data: this.data
        };
    }
}

export {
    Output
}