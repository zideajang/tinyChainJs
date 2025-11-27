import { Chain,Prompt,Model,ChainContext, Parser } from "../dist/tinychain.esm.js";

import { Message } from "../dist/tinychain.esm.js";

const simple_chain = Chain("simple_chain");
// 支持对于 chain 打印便于调试
// simple_chain.print()
const model = new Model();
model.add_system_message(Message.System(
    "你是一名开发人员"
))
const code_extract_parser = new Parser(定义提取规则)
simple_chain.addNode(model);
simple_chain.addNode(code_extract);
const ctx = ChainContext();
simple_chain.async_invoke("写一个 hello world in python",ctx);