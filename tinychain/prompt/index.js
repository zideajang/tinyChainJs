import { ChainNode } from "../core/chainnode.js";
import {Output} from "../core/output.js"
import {Message} from "../message/index.js"

// ## Prompt (ChainNode)
class Prompt extends ChainNode {
  constructor(promptStr, inputValues = []) {
    super({ type: "prompt", name: "PromptNode" });
    this.promptStr = promptStr; // e.g., "Hello {name}"
    this.inputValues = inputValues; // e.g., ["name"]
  }

  // 静态方法：转 Message
  static toMessage(input) {
    let content = "";
    if (typeof input === 'string') {
      content = input;
    } else if (typeof input === 'object') {
        // 简单假设 input map 是用来填充某个默认模板的，或者直接转 string
        content = JSON.stringify(input);
    }
    return Message.Human(content);
  }

  static fromString(inputStr) {
    const placeholders = [...inputStr.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
    return new Prompt(inputStr, placeholders);
  }

  // 简单的模板替换逻辑
  format(values) {
      let formatted = this.promptStr;
      for (const key of this.inputValues) {
          const val = values[key] || "";
          formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), val);
      }
      return formatted;
  }

  invoke(input, context) {
      // input 可以是 map 用于替换变量，或者直接是 string
      let rawInput = input;
      if (input instanceof Output){
        if (!input.isSuccess){
          return Output.failure(`Prompt node received failed input: ${input.error}`);
        }

        rawInput = input.content;
      }
      let resultStr = "";
      if (typeof rawInput === 'object' && rawInput !== null && !Array.isArray(rawInput)) {
          resultStr = this.format(input);
      } else if (typeof rawInput === 'string' || typeof rawInput === 'number'){
        if (this.inputValues.length === 1 && this.inputValues[0] === 'input'){
          resultStr = this.format({ [this.inputValues[0]]: rawInput });
        }else if (this.inputValues.length > 0){
          resultStr = this.format({}) + (rawInput ? `\n\n${rawInput}` : '');
        }else{
          resultStr = this.promptStr + (rawInput ? `\n\n${rawInput}` : '');
        }
      }else {
          return Output.failure(`Prompt node received unhandled input type: ${typeof rawInput}`);
      }
      return Output.success(resultStr, { 
        originalPrompt: this.promptStr, 
        inputValues: this.inputValues 
      });
  }

  async_invoke(input, context) {
      // Prompt 节点是同步的，直接返回 invoke 的结果的 Promise
      try {
          const result = this.invoke(input, context);
          
          return Promise.resolve(result);
      } catch (error) {
          return Promise.resolve(Output.failure(error.message || "Prompt invocation failed"));
      }
  }
}




// ## Memory
class Memory {
  constructor() {
    this.messages = [];
  }

  addMessage(message, callback = null) {
    this.messages.push(message);
    if (callback) callback(this.messages);
  }

  insertMessage(index, message, callback = null) {
    this.messages.splice(index, 0, message);
    if (callback) callback(this.messages);
  }

  deleteMessage(index, callback = null) {
    this.messages.splice(index, 1);
    if (callback) callback(this.messages);
  }

  load(callback) {
    // 模拟从某处加载
    if (callback) callback(this.messages);
    return this.messages;
  }

  save(callback) {
    if (callback) callback(this.messages);
  }

  filter(callback) {
    return callback(this.messages);
  }
}

export {
    Prompt
}