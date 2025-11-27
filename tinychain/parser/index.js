import { ChainNode } from "../core/chainnode.js";
// ## Parser (ChainNode)
class Parser extends ChainNode {
    constructor(schema) {
        super({ type: 'parser' });
        this.schema = schema;
    }

    parse(callback) {
        // 这里的逻辑通常依赖具体的 parse 需求
        // 这里假设它处理上一个节点的 output
    }

    invoke(input, context) {
        // 假设 input 是上一个节点的 output.content (string)
        // 这里做一个简单的 JSON parse 模拟
        try {
            const parsed = JSON.parse(input);
            return new Output(parsed);
        } catch (e) {
            return new Output(input, "Parse Failed, returned raw string");
        }
    }
}


export {
    Parser
}