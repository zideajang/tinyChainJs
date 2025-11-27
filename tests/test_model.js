import { Model,ChainContext } from "../dist/tinychain.esm.js"

const ctx = ChainContext.getInstance()

const model = new Model();
const resp = model.async_invoke("天空为什么是蓝色",ctx);
model.async_invoke("天空为什么是蓝色", ctx)
    .then(output => {
        // output 同样是 Output 实例
        console.log("模型响应内容:", output.content);
    })
    .catch(error => {
        console.error("模型调用失败:", error);
    });