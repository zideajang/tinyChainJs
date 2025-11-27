import { Chain,Prompt,ChainContext } from "../dist/tinychain.esm.js";

const simple_chain = new Chain("simple_chain");
const prompt = new Prompt(`
介绍一下分享课程名字:{name}以及价格{price}
    `,["name","price"])


simple_chain.addNode(prompt);
const ctx = new ChainContext();
const res = await simple_chain.async_invoke({
    "name":"深度学习",
    "price":299.0
},ctx);
console.log("--------------------- result -----------------------")

console.log(res.content);