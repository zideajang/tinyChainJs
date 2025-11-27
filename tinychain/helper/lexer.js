/**
 * LinkLang DSL Lexer (词法分析器)
 * 负责将源代码字符串转换为 Tokens 序列。
 */

const fs = require('fs');

// 1. Token 规格定义 (正则表达式和类型)
const TOKEN_SPEC = [
    { type: 'SKIP',        regex: /^[ \t\r]+/ },           // 空格、Tab、回车 (忽略)
    { type: 'COMMENT',     regex: /^\/\/.*(?:\n|$)/ },      // 单行注释 (忽略)
    { type: 'NEWLINE',     regex: /^\n/ },                 // 换行符
    
    // 操作符与分隔符 (长操作符在前)
    { type: 'PIPE',        regex: /^>>/ },                 // >> (流转)
    { type: 'ARROW',       regex: /^=>/ },                 // => (Router Case)
    { type: 'ASSIGN',      regex: /^=/ },                  // =
    { type: 'COLON',       regex: /^:/ },                  // :
    { type: 'COMMA',       regex: /^,/ },                  // ,
    { type: 'BIND',        regex: /^@/ },                  // @
    { type: 'LBRACE',      regex: /^{/ },                  // {
    { type: 'RBRACE',      regex: /^}/ },                  // }
    { type: 'LPAREN',      regex: /^\(/ },                 // (
    { type: 'RPAREN',      regex: /^\)/ },                 // )
    { type: 'LBRACKET',    regex: /^\[/ },                 // [
    { type: 'RBRACKET',    regex: /^\]/ },                 // ]
    
    // 关键字
    { type: 'KEYWORD',     regex: /^\b(def|chain|schema|with|memory|case|default|Input|StringOutput|Builtin|Model|Prompt|Tool|Router)\b/ },
    
    // 字面量
    { type: 'NUMBER',      regex: /^\d+(\.\d+)?/ },        // 数字
    { type: 'STRING',      regex: /^"(?:\\.|[^"\\])*"/ },   // 字符串
    { type: 'TEMPLATE_VAR',regex: /^\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/ }, // {{variable}}
    
    // 标识符
    { type: 'IDENTIFIER',  regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
];

class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

class ChainLexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
    }

    tokenize() {
        let currentInput = this.input;

        while (currentInput.length > 0) {
            let matched = false;

            for (const spec of TOKEN_SPEC) {
                const match = currentInput.match(spec.regex);
                
                if (match) {
                    matched = true;
                    const tokenValue = match[0];
                    const tokenLength = tokenValue.length;

                    // 更新位置信息
                    const startColumn = this.column;
                    
                    if (spec.type === 'NEWLINE') {
                        this.line++;
                        this.column = 1;
                    } else if (spec.type === 'SKIP' || spec.type === 'COMMENT') {
                        // 忽略
                        this.column += tokenLength;
                    } else {
                        // 创建 Token
                        this.tokens.push(new Token(spec.type, tokenValue, this.line, startColumn));
                        this.column += tokenLength;
                    }

                    // 推进输入字符串
                    currentInput = currentInput.substring(tokenLength);
                    this.position += tokenLength;
                    break;
                }
            }

            if (!matched) {
                throw new Error(`Lexer Error: Unexpected character '${currentInput[0]}' at line ${this.line}, column ${this.column}`);
            }
        }

        this.tokens.push(new Token('EOF', '', this.line, this.column));
        return this.tokens;
    }
}

module.exports = { ChainLexer, Token };