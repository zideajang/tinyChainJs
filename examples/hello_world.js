import { Chain,Model } from "../dist/tinychain.esm.js";

const simple_chain = new Chain("simple chain");
simple_chain.addNode(new Model());
// 直接传字符串，Chain 内部处理为 input，Model 收到后加入 messages
const result = await simple_chain.async_invoke("天空为什么是蓝色"); 
console.log(result.content);