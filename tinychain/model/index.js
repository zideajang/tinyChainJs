import { ChainNode } from "../core/chainnode.js";
import { ChainContext } from "../core/context.js";
import { Output } from "../core/output.js";

class Model extends ChainNode {
    constructor(modelName = "qwen2.5:latest", client = "ollama", config = {}) {
        super({ type: "model", name: `Model_${modelName}` });
        this.modelName = modelName;
        this.client = client;
        this.baseUrl = config.baseUrl || "http://localhost:11434";
        this.temperature = config.temperature || 0.7;
        this.boundTools = []; // 仅存储定义
        this.format = null; // 存储结构化输出 schema
    }

    // 绑定工具
    bind_tool(tool) {
        // 1. 保存定义供 API 调用
        const toolDef = {
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.schema
            }
        };
        this.boundTools.push(toolDef);
        return this; // 链式
    }

    // 绑定结构化输出
    bind_structure(schemaOrClass) {
        // 简单处理：如果传入的是 Class，需要用户提供 schema 静态属性，或者我们做一个简易转换
        // 这里假设传入的是 JSON Schema 对象
        if (schemaOrClass.schema) {
            this.format = schemaOrClass.schema; // 比如 Zod 转换后的
        } else if (typeof schemaOrClass === 'function') {
             // 简单的 Class 处理 (仅作为示例，实际需要反射库)
             // 假设用户传了 Class Employee
             this.format = {
                 type: "object",
                 properties: {
                     // 无法自动推断，建议用户直接传 Schema
                 },
                 required: [] // ...
             };
             console.warn("[Model] Passing a Class directly needs a valid schema. Using 'json' mode.");
             this.format = "json"; 
        } else {
            // 直接是 Schema 对象
            this.format = schemaOrClass;
        }
        return this;
    }

    async async_invoke(input, context = ChainContext.getInstance()) {
        // 1. 注册工具到 Context (为了让 Chain 在回调时能找到 Tool 实例)
        // 注意：这里需要传入 Tool 实例，而不是 definition。
        // 由于 bind_tool 只存了 definition，我们需要一个机制在 Context 里存实例。
        // *修复方案*：在 bind_tool 时我们无法访问 Context。
        // 实际上，Tool 实例应该在 addNode 时就被 Chain 或 Context 知道。
        // 这里我们假设 context 已经有了，或者我们在 callOllama 前不做 execute。
        
        // 2. 准备消息
        let messages = context.getMessages();
        
        // 如果 input 是字符串且不是来自上一个节点的 Output (防止重复)
        // 但通常 Prompt 节点已经把 input 转为 Message 存入 context 了
        // 如果 input 存在且不在 messages 里，追加它
        if (input && typeof input === 'string') {
             // 检查最后一条是不是这个内容，避免重复
             const last = messages[messages.length - 1];
             if (!last || last.content !== input) {
                 messages.push({ role: 'user', content: input });
             }
        }

        // 3. 调用 Ollama
        const response = await this._callOllama(messages, this.boundTools, this.format);

        // 4. 处理结果
        const resultMsg = response.message;
        
        // *重要*: 将 Assistant 的回复加入历史
        context.addMessage(resultMsg);

        // 如果有 tool_calls，返回 Raw Response 给 Chain 处理
        if (resultMsg.tool_calls && resultMsg.tool_calls.length > 0) {
            return new Output(null, null, resultMsg); // Data 携带原始 tool calls
        }

        return new Output(resultMsg.content, null, response);
    }

    async _callOllama(messages, tools, format) {
        const payload = {
            model: this.modelName,
            messages: messages,
            stream: false,
            options: { temperature: this.temperature }
        };

        if (tools.length > 0) payload.tools = tools;
        if (format) payload.format = format; // Ollama 支持 JSON Schema 或 "json"

        const res = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Ollama Error: ${res.statusText}`);
        return await res.json();
    }
}

export { Model };