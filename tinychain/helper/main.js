/**
 * LinkLang DSL Compiler Frontend Runner
 * 演示如何加载 chain 文件，执行 Lexer 和 Parser，并输出 AST。
 */

const fs = require('fs');
const path = require('path');
const { ChainLexer } = require('./chain_lexer');
const { ChainParser } = require('./chain_parser');

function printAST(node, indent = 0) {
    if (!node || typeof node !== 'object') {
        console.log(' '.repeat(indent) + String(node));
        return;
    }
    
    // 简化打印逻辑，只显示类型和关键属性
    const type = node.type || 'Object';
    console.log(' '.repeat(indent) + `[${type}]`);
    
    for (const key in node) {
        if (key === 'type') continue;
        const value = node[key];
        
        if (Array.isArray(value)) {
            console.log(' '.repeat(indent + 2) + `${key}: [`);
            value.forEach(item => printAST(item, indent + 4));
            console.log(' '.repeat(indent + 2) + `]`);
        } else if (value && typeof value === 'object' && value.type) {
            console.log(' '.repeat(indent + 2) + `${key}:`);
            printAST(value, indent + 4);
        } else {
            console.log(' '.repeat(indent + 2) + `${key}: ${JSON.stringify(value)}`);
        }
    }
}


function runCompilerFrontend(filename) {
    const filePath = path.join(__dirname, filename);
    
    console.log(`\n--- 1. Loading File: ${filename} ---`);
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at ${filePath}`);
        return;
    }
    const code = fs.readFileSync(filePath, 'utf8');

    // --- 2. Lexical Analysis (词法分析) ---
    console.log('\n--- 2. Lexer Output (Tokens) ---');
    try {
        const lexer = new ChainLexer(code);
        const tokens = lexer.tokenize();
        
        tokens.slice(0, -1).forEach(t => { // 忽略 EOF 打印
            console.log(`L${t.line.toString().padEnd(2)} C${t.column.toString().padEnd(2)} [${t.type.padEnd(16)}] '${t.value}'`);
        });

        // --- 3. Syntactic Analysis (语法分析) ---
        console.log('\n--- 3. Parser Output (AST) ---');
        const parser = new ChainParser(tokens);
        const ast = parser.parseProgram();
        
        printAST(ast);
        
        console.log('\n✅ LinkLang Compilation Frontend Successful!');
        
    } catch (e) {
        console.error(`\n❌ Compilation Failed: ${e.message}`);
        // console.error(e);
    }
}

// 运行编译器前端
runCompilerFrontend('demo.chain');