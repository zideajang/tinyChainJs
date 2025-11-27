import { Chain,Prompt,Model,ChainContext } from "../dist/tinychain.esm.js";

import { Message } from "../dist/tinychain.esm.js";

const simple_chain = Chain("simple_chain");
// 支持对于 chain 打印便于调试
// simple_chain.print()
const model = new Model();
model.add_system_message(Message.System(
    "你是一名开发人员"
))
simple_chain.addNode(model);
const ctx = ChainContext();
simple_chain.async_invoke("写一个 hello world in python",ctx);