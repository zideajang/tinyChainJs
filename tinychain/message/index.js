/**
 * @typedef {'system' | 'assistant' | 'user' | 'unknown'} MessageRole
 */

/**
 * 实现了 IMessage 接口的不可变消息类。
 * @implements {IMessage}
 */
class Message {
    /** @type {string} */
    #content;
    /** @type {MessageRole} */
    #role;

    /**
     * @param {string} content - 消息内容
     * @param {MessageRole} [role='unknown'] - 消息角色
     * @throws {Error} 如果 role 非法
     */
    constructor(content, role = 'unknown') {
        const validRoles = ['system', 'assistant', 'user', 'unknown'];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role '${role}'. Role must be one of ${validRoles.join(', ')}.`);
        }

        // 使用私有字段存储属性，实现内部封装
        this.#content = content;
        this.#role = role;

    }

    // --- 只读访问器 (Getters) ---
    // 这是实现不可变性的关键。外部只能读取，不能写入。

    /**
     * @returns {string} 消息内容
     */
    get content() {
        return this.#content;
    }

    /**
     * @returns {MessageRole} 消息角色
     */
    get role() {
        return this.#role;
    }

    // --- 静态工厂方法 (Static Factory Methods) ---

    /**
     * 类似于 Maybe.of，用于创建一个新的 Message 实例
     * @param {string} content - 消息内容
     * @param {MessageRole} [role='unknown'] - 消息角色
     * @returns {Message} 一个新的 Message 实例
     */
    static of(content, role) {
        return new Message(content, role);
    }

    /**
     * 创建一个 SystemMessage 实例
     * @param {string} content - 消息内容
     * @returns {Message}
     */
    static System(content) {
        return new Message(content, 'system');
    }

    /**
     * 创建一个 AIMessage 实例
     * @param {string} content - 消息内容
     * @returns {Message}
     */
    static AI(content) {
        return new Message(content, 'assistant');
    }

    /**
     * 创建一个 HumanMessage 实例
     * @param {string} content - 消息内容
     * @returns {Message}
     */
    static Human(content) {
        return new Message(content, 'user');
    }

    // --- 实例方法 (Instance Methods) ---

    /**
     * 检查消息内容是否为 null、undefined 或空字符串
     * @returns {boolean} 如果内容为空则返回 true，否则返回 false
     */
    isNullString() {
        // 使用 this.#content 访问私有字段
        return this.#content === null || this.#content === undefined || String(this.#content).trim() === '';
    }

    /**
     * 将一个函数应用于消息内容，并返回一个新的 Message 实例
     * 类似于函子（Functor）的 map 操作
     * @param {function(string): *} fn - 用于转换内容的函数。返回值可以是任何类型，但会被强制转换为字符串作为新内容。
     * @returns {Message} 一个新的 Message 实例，内容已被转换
     */
    map(fn) {
        // 应用函数到当前内容，然后用新内容和相同的角色创建一个新的 Message
        // 确保新内容被转换为字符串，以符合 Message 构造器的预期
        const newContent = String(fn(this.#content));
        // 注意：这里调用的是 this.constructor.of，即 Message.of
        return this.constructor.of(newContent, this.#role);
    }
}

// 导出 Message 类及其方便的工厂方法
export {
    Message,
};