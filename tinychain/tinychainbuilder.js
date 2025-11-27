/**
 * TinyChain Compiler
 * Usage: node tinychainbuilder.js -source <file>.chain -target <file>.js
 */

// const fs = require('fs');
// const path = require('path');
import path from 'path';
import fs from 'fs';
// ==========================================
// 1. Lexer (词法分析器)
// ==========================================

const TokenType = {
    KEYWORD: 'KEYWORD',     // def, chain, schema
    IDENTIFIER: 'ID',       // variable names, function names
    STRING: 'STRING',       // "..."
    NUMBER: 'NUMBER',       // 123
    OPERATOR: 'OP',         // =, >>, @
    PUNCTUATION: 'PUNC',    // (, ), ,, {, }, :
    EOF: 'EOF'
};

class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.tokens = [];
        this.tokenize();
    }

    tokenize() {
        while (this.pos < this.input.length) {
            const char = this.input[this.pos];

            // 1. Skip Whitespace
            if (/\s/.test(char)) {
                this.pos++;
                continue;
            }

            // 2. Skip Comments //
            if (char === '/' && this.input[this.pos + 1] === '/') {
                while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
                    this.pos++;
                }
                continue;
            }

            // 3. Operators: >>, =, @
            if (char === '>' && this.input[this.pos + 1] === '>') {
                this.tokens.push({ type: TokenType.OPERATOR, value: '>>' });
                this.pos += 2;
                continue;
            }
            if ('=@'.includes(char)) {
                this.tokens.push({ type: TokenType.OPERATOR, value: char });
                this.pos++;
                continue;
            }

            // 4. Punctuation
            if ('(),{}[]:'.includes(char)) {
                this.tokens.push({ type: TokenType.PUNCTUATION, value: char });
                this.pos++;
                continue;
            }

            // 5. Strings (Simple support for " and """)
            if (char === '"') {
                let value = '';
                // Check for triple quote
                if (this.input.substr(this.pos, 3) === '"""') {
                    this.pos += 3;
                    while (this.pos < this.input.length && this.input.substr(this.pos, 3) !== '"""') {
                        value += this.input[this.pos++];
                    }
                    this.pos += 3;
                } else {
                    this.pos++;
                    while (this.pos < this.input.length && this.input[this.pos] !== '"') {
                        value += this.input[this.pos++];
                    }
                    this.pos++;
                }
                this.tokens.push({ type: TokenType.STRING, value });
                continue;
            }

            // 6. Numbers
            if (/[0-9]/.test(char)) {
                let value = '';
                while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
                    value += this.input[this.pos++];
                }
                this.tokens.push({ type: TokenType.NUMBER, value });
                continue;
            }

            // 7. Identifiers & Keywords
            if (/[a-zA-Z_]/.test(char)) {
                let value = '';
                while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
                    value += this.input[this.pos++];
                }
                const keywords = ['def', 'chain', 'schema'];
                const type = keywords.includes(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
                this.tokens.push({ type, value });
                continue;
            }

            throw new Error(`Unexpected character: ${char} at pos ${this.pos}`);
        }
        this.tokens.push({ type: TokenType.EOF, value: null });
    }
}

// ==========================================
// 2. Parser (语法分析器)
// ==========================================

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
    }

    peek() { return this.tokens[this.current]; }
    consume() { return this.tokens[this.current++]; }
    match(type, value) {
        const token = this.peek();
        if (token.type === type && (!value || token.value === value)) {
            this.consume();
            return true;
        }
        return false;
    }
    expect(type, value) {
        if (!this.match(type, value)) {
            throw new Error(`Expected ${type} ${value || ''} but got ${this.peek().type} ${this.peek().value}`);
        }
        return this.tokens[this.current - 1]; // Return matched token
    }

    parse() {
        const ast = { type: 'Program', body: [] };
        while (this.peek().type !== TokenType.EOF) {
            const token = this.peek();
            if (token.type === TokenType.KEYWORD) {
                if (token.value === 'def') ast.body.push(this.parseDef());
                else if (token.value === 'chain') ast.body.push(this.parseChain());
                else if (token.value === 'schema') ast.body.push(this.parseSchema());
                else this.consume(); // Unknown keyword skip
            } else {
                this.consume(); // Skip unknown top level
            }
        }
        return ast;
    }

    // def name = Expression
    parseDef() {
        this.consume(); // def
        const name = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.OPERATOR, '=');
        
        let expr = this.parseExpression();
        
        // Handle Modifier: @ bind(...) or @ output(...)
        if (this.match(TokenType.OPERATOR, '@')) {
             const modifierName = this.expect(TokenType.IDENTIFIER).value; // bind or output
             const args = this.parseArgs();
             expr = {
                 type: 'ModifiedExpression',
                 base: expr,
                 modifier: modifierName,
                 args: args
             };
        }

        return { type: 'DefStatement', name, value: expr };
    }

    // chain Name = Node >> Node
    parseChain() {
        this.consume(); // chain
        const name = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.OPERATOR, '=');
        
        const nodes = [];
        nodes.push(this.expect(TokenType.IDENTIFIER).value);
        
        while (this.match(TokenType.OPERATOR, '>>')) {
            nodes.push(this.expect(TokenType.IDENTIFIER).value);
        }

        return { type: 'ChainStatement', name, nodes };
    }

    // schema Name { key: type, ... }
    parseSchema() {
        this.consume(); // schema
        const name = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.PUNCTUATION, '{');
        
        const properties = [];
        while (this.peek().type !== TokenType.PUNCTUATION || this.peek().value !== '}') {
            const key = this.expect(TokenType.IDENTIFIER).value;
            this.expect(TokenType.PUNCTUATION, ':');
            const type = this.expect(TokenType.IDENTIFIER).value;
            properties.push({ key, type });
            this.match(TokenType.PUNCTUATION, ','); // Optional comma
        }
        this.expect(TokenType.PUNCTUATION, '}');

        return { type: 'SchemaStatement', name, properties };
    }

    // Model(...) or Tool(...) or Prompt(...)
    parseExpression() {
        const callee = this.expect(TokenType.IDENTIFIER).value;
        // Check if it's a function call
        if (this.peek().value === '(') {
            const args = this.parseArgs();
            return { type: 'CallExpression', callee, args };
        }
        return { type: 'Variable', name: callee };
    }

    parseArgs() {
        this.expect(TokenType.PUNCTUATION, '(');
        const args = [];
        while (this.peek().type !== TokenType.PUNCTUATION || this.peek().value !== ')') {
            // Handle named args: name="value" or just "value" or { object }
            let argKey = null;
            
            // Lookahead for named argument (key=)
            if (this.peek().type === TokenType.IDENTIFIER && this.tokens[this.current+1].value === '=') {
                argKey = this.consume().value;
                this.consume(); // =
            }

            let argValue;
            const token = this.peek();
            
            if (token.type === TokenType.STRING) argValue = `"${this.consume().value}"`;
            else if (token.type === TokenType.NUMBER) argValue = this.consume().value;
            else if (token.type === TokenType.IDENTIFIER) argValue = this.consume().value;
            else if (token.value === '[') argValue = this.parseArray();
            else if (token.value === '{') argValue = this.parseObjectBlock(); 
            else this.consume(); // skip error

            args.push({ key: argKey, value: argValue });
            this.match(TokenType.PUNCTUATION, ',');
        }
        this.expect(TokenType.PUNCTUATION, ')');
        return args;
    }

    // Very simple nested brace parser for JS objects inside DSL
    parseObjectBlock() {
        let depth = 0;
        let start = this.current;
        let raw = "";
        
        do {
            const t = this.consume();
            if (t.value === '{') depth++;
            if (t.value === '}') depth--;
            // Reconstruct rough JS object string
            if (t.type === TokenType.STRING) raw += `"${t.value}"`;
            else if (t.type === TokenType.OPERATOR && t.value === '=') raw += ':'; // DSL uses = sometimes, JS uses :
            else raw += t.value;
            
            // Add spacing for safety? simplified here.
            raw += " ";
        } while (depth > 0 && this.current < this.tokens.length);
        
        // Cleanup: DSL might use properties like `city: { type: "string" }` which is valid JS
        return raw.trim(); 
    }

    parseArray() {
        this.consume(); // [
        let items = [];
        while(this.peek().value !== ']') {
             items.push(this.expect(TokenType.IDENTIFIER).value);
             this.match(TokenType.PUNCTUATION, ',');
        }
        this.consume(); // ]
        return `[${items.join(', ')}]`;
    }
}

// ==========================================
// 3. Code Generator (代码生成器)
// ==========================================

class CodeGenerator {
    constructor(ast) {
        this.ast = ast;
        this.imports = new Set(["Chain", "Model", "ChainContext"]);
        this.codeLines = [];
        this.contextSetup = []; // For storing tool registry logic
        this.hasContext = false;
    }

    generate() {
        this.ast.body.forEach(node => {
            if (node.type === 'DefStatement') this.genDef(node);
            if (node.type === 'SchemaStatement') this.genSchema(node);
            if (node.type === 'ChainStatement') this.genChain(node);
        });

        // Header
        const importStmt = `import { ${Array.from(this.imports).join(', ')} } from "../dist/tinychain.esm.js";`;
        
        // Context Boilerplate if needed
        let ctxCode = "";
        if (this.hasContext) {
            ctxCode = `\nconst ctx = new ChainContext();\nconst toolRegistry = new Map();\n${this.contextSetup.join('\n')}\nctx.set("tool_registry", toolRegistry);`;
        }

        return `${importStmt}\n\n${this.codeLines.join('\n')}\n${ctxCode}`;
    }

    genDef(node) {
        const varName = node.name;
        
        // Handle "ModifiedExpression" (e.g. qwen @ bind(...))
        if (node.value.type === 'ModifiedExpression') {
            const base = node.value.base;
            const mod = node.value.modifier;
            const args = node.value.args;

            if (base.type === 'Variable') {
                // e.g. def agent_with_tools = qwen_agent @ bind(tools=[...])
                // In JS: const agent_with_tools = qwen_agent; qwen_agent.bind_tool(...)
                // But simplified: we assume mutations on the object or create a configured clone.
                // Following the example: just mutate the model variable
                
                if (mod === 'bind') {
                    // Find tools arg
                    const toolArg = args.find(a => a.key === 'tools');
                    if (toolArg) {
                        // toolArg.value is string "[WeatherTool]"
                        // Clean brackets
                        const tools = toolArg.value.replace(/^\[|\]$/g, '').split(',').map(s=>s.trim());
                        
                        tools.forEach(t => {
                           // Add to registry logic
                           this.hasContext = true;
                           this.contextSetup.push(`toolRegistry.set("${t}.name", ${t});`); // Hack: assuming tool instance has .name or we use var name
                           // Add bind logic
                           // We need to know the base variable name. 
                           // If DSL is: def new_agent = old_agent @ bind...
                           // JS: const new_agent = old_agent; new_agent.bind_tool(WeatherTool);
                           this.codeLines.push(`const ${varName} = ${base.name};`);
                           this.codeLines.push(`${varName}.bind_tool(${t});`);
                        });
                    }
                } else if (mod === 'output') {
                     // def structured_llm = general_llm @ output(ProductReview)
                     // JS: const structured_llm = general_llm; structured_llm.bind_structure(ProductReview);
                     const schemaName = args[0].value; // Positional arg 0
                     this.codeLines.push(`const ${varName} = ${base.name};`);
                     this.codeLines.push(`${varName}.bind_structure(${schemaName});`);
                }
            }
            return;
        }

        // Handle Standard Call (Model, Tool, Prompt)
        if (node.value.type === 'CallExpression') {
            const type = node.value.callee;
            const args = node.value.args;
            
            if (type === 'Model') {
                const params = this.formatArgsToObj(args); // Convert named args to object or string
                // If only 1 arg and unnamed, treat as name
                let constructorArgs = "";
                if (args.length === 1 && !args[0].key) constructorArgs = args[0].value;
                else if (args.length > 0) constructorArgs = JSON.stringify(params); // simplified
                
                // Specific hack for example 1: Model() -> new Model()
                // Specific hack for example 2: Model(model_name=...)
                if(params.model_name) constructorArgs = `"${params.model_name}"`;

                this.codeLines.push(`const ${varName} = new Model(${constructorArgs});`);
            } 
            else if (type === 'Tool') {
                this.imports.add('Tool');
                // Extract args: name, func, desc, schema
                const p = this.formatArgsToObj(args);
                // Assume `getWeather` etc are global/imported funcs.
                // Schema object needs to be kept as raw JS object string from parser
                this.codeLines.push(`const ${varName} = new Tool("${p.name}", "${p.desc}", ${p.func}, ${p.schema});`);
            }
            else if (type === 'Prompt') {
                // Template literals
                const val = args[0].value;
                this.codeLines.push(`const ${varName} = ${val}; // Prompt template`); 
            }
            else if (type === 'Builtin') {
                 // def AutoToolExecutor = Builtin(type="AutoToolExecutor")
                 // Mapping to class
                 const p = this.formatArgsToObj(args);
                 this.imports.add(p.type);
                 this.codeLines.push(`const ${varName} = new ${p.type}();`);
            }
        }
    }

    genSchema(node) {
        // Convert DSL Schema to JSON Schema
        const props = {};
        const required = [];
        node.properties.forEach(p => {
            props[p.key] = { type: p.type }; // simple mapping
            required.push(p.key);
        });

        const jsonSchema = {
            type: "object",
            properties: props,
            required: required
        };

        this.codeLines.push(`const ${node.name} = ${JSON.stringify(jsonSchema, null, 4)};`);
    }

    genChain(node) {
        // const Name = new Chain("Name");
        this.codeLines.push(`const ${node.name} = new Chain("${node.name}");`);
        
        node.nodes.forEach(n => {
            if (n === 'Input') {
                this.imports.add('Input');
                this.codeLines.push(`${node.name}.addNode(new Input());`);
            } else if (n === 'StringOutput') {
                this.imports.add('StringOutput');
                this.codeLines.push(`${node.name}.addNode(new StringOutput());`);
            } else if (n === 'JsonParser') {
                // Not in imports usually, maybe a util, assume Node here for demo
                this.imports.add('JsonParser'); // hypothetical
                this.codeLines.push(`${node.name}.addNode(new JsonParser());`);
            } else {
                // Variable (Model, ToolExecutor, etc)
                this.codeLines.push(`${node.name}.addNode(${n});`);
            }
        });

        // Add invocation snippet at the bottom for convenience
        const invokeArgs = this.hasContext ? `input, ctx` : `input`;
        this.codeLines.push(`\n// Execution Helper`);
        this.codeLines.push(`async function run_${node.name}(input) {`);
        this.codeLines.push(`    const res = await ${node.name}.async_invoke(${invokeArgs});`);
        this.codeLines.push(`    console.log(res.content);`);
        this.codeLines.push(`}`);
    }

    formatArgsToObj(args) {
        const obj = {};
        args.forEach(a => {
            if (a.key) obj[a.key] = a.value.replace(/"/g, ''); // strip quotes for keys/vars
            // Handle raw object strings (like schema={...}) specially if needed
            if (a.key === 'schema') obj[a.key] = a.value; 
        });
        return obj;
    }
}

// ==========================================
// 4. CLI Driver
// ==========================================

function main() {
    const args = process.argv.slice(2);
    const srcIdx = args.indexOf('-source');
    const targetIdx = args.indexOf('-target');

    if (srcIdx === -1 || targetIdx === -1) {
        console.error("Usage: node tinychainbuilder.js -source <file>.chain -target <file>.js");
        process.exit(1);
    }

    const sourcePath = args[srcIdx + 1];
    const targetPath = args[targetIdx + 1];

    try {
        const sourceCode = fs.readFileSync(sourcePath, 'utf-8');
        
        console.log(`Compiling ${sourcePath}...`);
        
        // 1. Lex
        const lexer = new Lexer(sourceCode);
        
        // 2. Parse
        const parser = new Parser(lexer.tokens);
        const ast = parser.parse();
        
        // 3. Generate
        const generator = new CodeGenerator(ast);
        const jsCode = generator.generate();

        fs.writeFileSync(targetPath, jsCode);
        console.log(`Success! Output written to ${targetPath}`);

    } catch (e) {
        console.error("Compilation Failed:", e.message);
        process.exit(1);
    }
}

main();