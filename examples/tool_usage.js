import { Chain,Model,Tool,ChainContext } from "../dist/tinychain.esm.js";
const simple_chain = new Chain("tool_chain");
const ctx = new ChainContext();

// 1. 定义工具函数 (注意参数解构)
function getWeather({ city }) {
    const data = { "沈阳": "寒冷 -8度", "北京": "晴朗 5度" };
    return data[city] || "未知";
}

// 2. 创建 Tool 实例
const weatherTool = new Tool(
    "get_weather",
    "获取城市天气",
    getWeather, // func
    {
        type: "object",
        properties: { city: { type: "string" } },
        required: ["city"]
    }
);

// 3. 将工具实例注册到 Context (以便 Chain 能找到并执行它)
// *新步骤*: 我们需要一个地方存 Tool 实例
const toolRegistry = new Map();
toolRegistry.set("get_weather", weatherTool);
ctx.set("tool_registry", toolRegistry);

// 4. 绑定到 Model (告诉 LLM 有这个工具)
const model = new Model("qwen3:8b"); // 确保模型支持 tool calling
model.bind_tool(weatherTool);

simple_chain.addNode(model);

// 5. 执行
// Chain 会：Model -> 返回 ToolCall -> Chain 执行 getWeather -> Chain 再次调用 Model -> 返回最终文本
const res = await simple_chain.async_invoke("今天沈阳天气怎么样", ctx);
console.log(res.content);