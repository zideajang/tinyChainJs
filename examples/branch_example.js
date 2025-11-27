import { Chain,Prompt,Model,ChainContext } from "../dist/tinychain.esm.js";



const simple_chain = Chain("simple_chain");
// 支持对于 chain 打印便于调试
// simple_chain.print()
const prompt = Prompt(`
介绍一下分享课程名字:{name}以及价格{price}
    `,["name","price"])

simple_chain.addNode(prompt);
simple_chain.addBranchNode(定义规则,ANode,BNode)
const ctx = ChainContext();
ctx.set("name","深度学习");
ctx.set("price",299);
simple_chain.async_invoke("",ctx);