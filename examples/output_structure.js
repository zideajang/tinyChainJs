import { Chain,Model } from "../dist/tinychain.esm.js";
const model = new Model();

// JSON Schema
const employeeSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        age: { type: "integer" },
        salary: { type: "number" }
    },
    required: ["name", "age", "salary"]
};

// 绑定 Schema (对应 Ollama 的 format 参数)
model.bind_structure(employeeSchema);

const chain = new Chain("struct_chain").addNode(model);
const res = await chain.async_invoke("Tony is 30 years old and makes 60k");
// result.content 将是一个 JSON 字符串，因为 Ollama 强制输出了 JSON
console.log(JSON.parse(res.content));