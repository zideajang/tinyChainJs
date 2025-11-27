import { ChainNode } from "../core/chainnode.js";
import { Output } from "../core/output.js";

class Tool extends ChainNode {
    constructor(name, description, func, schema) {
        super({ type: "tool", name: name });
        this.description = description;
        this.func = func;
        this.schema = schema;
    }

    // args 通常是对象 { city: "Shenyang" }
    async call(args) {
        try {
            // 如果 func 是普通函数：func(city)
            // 如果 args 是对象，我们需要解构或者直接传
            // 这里假设 func 签名是 func({city}) 或者 func(city) 取决于实现
            // 为了通用性，建议 func 接收一个对象参数
            if (typeof args === 'object') {
                // 尝试将对象参数展开传给函数，或者直接传对象
                // 简单起见，我们规定 func 必须接收单一对象参数
                return await this.func(args);
            } 
            return await this.func(args);
        } catch (e) {
            return `Tool Execution Error: ${e.message}`;
        }
    }
    
    // 用于 Chain 调用的入口
    async async_invoke(input, context) {
        return new Output(await this.call(input));
    }
}

export { Tool };