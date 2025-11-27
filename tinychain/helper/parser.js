/**
 * LinkLang DSL Parser (语法分析器)
 * 负责将 Tokens 序列转换为 AST。
 */

const { Identifier, Literal, ListLiteral, FunctionCall, Pipeline, BindExpression, DefStatement, ChainStatement, Program } = require('./ast_nodes');
const { Token } = require('./chain_lexer');

class ChainParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    current() {
        return this.tokens[this.position];
    }

    peek(offset = 1) {
        return this.tokens[this.position + offset];
    }

    consume(expectedType = null, expectedValue = null) {
        const token = this.current();
        if (token.type === 'EOF') {
            throw new Error(`Parser Error: Unexpected end of file. Expected ${expectedType || 'a token'}`);
        }

        if (expectedType && token.type !== expectedType) {
            throw new Error(`Parser Error: Expected token type ${expectedType}, but got ${token.type} ('${token.value}') at L${token.line}`);
        }
        if (expectedValue && token.value !== expectedValue) {
            throw new Error(`Parser Error: Expected token value ${expectedValue}, but got '${token.value}' at L${token.line}`);
        }
        
        this.position++;
        return token;
    }

    // ------------------- 核心解析方法 -------------------

    parseProgram() {
        const statements = [];
        while (this.current().type !== 'EOF') {
            const token = this.current();
            
            if (token.type === 'KEYWORD') {
                if (token.value === 'def') {
                    statements.push(this.parseDefStatement());
                } else if (token.value === 'chain') {
                    statements.push(this.parseChainStatement());
                } else if (token.value === 'schema') {
                    statements.push(this.parseSchemaStatement());
                } else if (token.type === 'NEWLINE') {
                    this.consume();
                } else {
                    throw new Error(`Parser Error: Unexpected keyword '${token.value}' at L${token.line}`);
                }
            } else if (token.type === 'NEWLINE') {
                this.consume(); // 忽略顶层换行
            } else {
                 throw new Error(`Parser Error: Expected top-level statement (def, chain, schema), got ${token.type} '${token.value}' at L${token.line}`);
            }
        }
        return new Program(statements);
    }
    
    parseSchemaStatement() {
        this.consume('KEYWORD', 'schema');
        const name = this.consume('IDENTIFIER').value;
        this.consume('LBRACE');
        
        const fields = [];
        while (this.current().type !== 'RBRACE') {
            const fieldName = this.consume('IDENTIFIER').value;
            this.consume('COLON');
            const fieldType = this.consume('IDENTIFIER').value;
            // 简化处理 list<string> 等复杂类型，这里只取 IDENTIFIER 作为类型名
            
            fields.push({ name: fieldName, type: fieldType });

            if (this.current().type === 'COMMA') {
                this.consume();
            } else if (this.current().type === 'RBRACE') {
                break;
            } else if (this.current().type !== 'NEWLINE') {
                // 允许换行或逗号作为分隔
                 throw new Error(`Parser Error: Expected ',' or '}' in schema definition at L${this.current().line}`);
            }
        }
        this.consume('RBRACE');
        return new SchemaStatement(name, fields);
    }
    
    parseDefStatement() {
        this.consume('KEYWORD', 'def');
        const name = this.consume('IDENTIFIER').value;
        this.consume('ASSIGN');
        
        let value = this.parseExpressionWithBlock();
        
        // 忽略行末换行
        if (this.current().type === 'NEWLINE') this.consume();
        
        return new DefStatement(name, value);
    }
    
    parseChainStatement() {
        this.consume('KEYWORD', 'chain');
        const name = this.consume('IDENTIFIER').value;
        this.consume('ASSIGN');
        
        let context = null;
        let pipeline = null;

        // 检查 with memory 块结构
        if (this.current().type === 'KEYWORD' && this.current().value === 'with') {
            this.consume('KEYWORD', 'with');
            this.consume('KEYWORD', 'memory'); // 假设只支持 memory
            context = this.parseFunctionCall('memory');
            this.consume('LBRACE');
            pipeline = this.parsePipeline();
            this.consume('RBRACE');
        } else {
            // 简单管道结构
            pipeline = this.parsePipeline();
        }
        
        // 忽略行末换行
        if (this.current().type === 'NEWLINE') this.consume();
        
        return new ChainStatement(name, pipeline, context);
    }

    parsePipeline() {
        const steps = [];
        steps.push(this.parseBindExpression());

        while (this.current().type === 'PIPE') {
            this.consume('PIPE');
            steps.push(this.parseBindExpression());
        }

        return new Pipeline(steps);
    }

    // 处理 @ bind(tools=[...]) 表达式
    parseBindExpression() {
        let expression = this.parseExpressionWithBlock();

        while (this.current().type === 'BIND') {
            this.consume('BIND');
            const modifier = this.parseFunctionCall(this.consume('IDENTIFIER').value);
            expression = new BindExpression(expression, modifier);
        }

        return expression;
    }

    // 允许 FunctionCall 后面紧跟一个 {} 块 (如 Router)
    parseExpressionWithBlock() {
        let expr = this.parseExpression();
        
        if (expr.type === 'FunctionCall' && expr.name === 'Router' && this.current().type === 'LBRACE') {
            // 这是一个 Router 块，需要特殊处理
            const block = this.parseRouterBlock();
            expr.args['__router_block'] = block; // 将块作为特殊参数附加
        }
        return expr;
    }

    parseExpression() {
        const token = this.current();

        if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
            const name = this.consume().value;
            // 检查是否是函数调用：Model(...)
            if (this.current().type === 'LPAREN') {
                return this.parseFunctionCall(name);
            }
            // 否则是标识符：general_llm, Input, StringOutput
            return new Identifier(name);
        } else if (token.type === 'STRING') {
            return new Literal(this.consume().value.slice(1, -1), 'string');
        } else if (token.type === 'NUMBER') {
            return new Literal(parseFloat(this.consume().value), 'number');
        } else if (token.type === 'LBRACE') {
            return this.parseObjectLiteral();
        } else if (token.type === 'LBRACKET') {
            return this.parseListLiteral();
        } else if (token.type === 'TEMPLATE_VAR') {
            // 模板变量作为特殊字符串字面量处理
            return new Literal(this.consume().value, 'template_var');
        } else {
            throw new Error(`Parser Error: Unexpected token in expression: ${token.type} '${token.value}' at L${token.line}`);
        }
    }

    parseFunctionCall(name) {
        this.consume('LPAREN');
        const args = {};
        
        while (this.current().type !== 'RPAREN') {
            // 命名参数: name = value
            const argName = this.consume('IDENTIFIER').value;
            this.consume('ASSIGN');
            const argValue = this.parseExpression();
            args[argName] = argValue;

            if (this.current().type === 'COMMA') {
                this.consume();
            } else if (this.current().type !== 'RPAREN') {
                throw new Error(`Parser Error: Expected ',' or ')' in function call at L${this.current().line}`);
            }
        }
        this.consume('RPAREN');
        return new FunctionCall(name, args);
    }
    
    parseListLiteral() {
        this.consume('LBRACKET');
        const items = [];
        while (this.current().type !== 'RBRACKET') {
            items.push(this.parseExpression());
            if (this.current().type === 'COMMA') {
                this.consume();
            } else if (this.current().type !== 'RBRACKET') {
                throw new Error(`Parser Error: Expected ',' or ']' in list literal at L${this.current().line}`);
            }
        }
        this.consume('RBRACKET');
        return new ListLiteral(items);
    }

    parseRouterBlock() {
        this.consume('LBRACE');
        const cases = [];
        let defaultAction = null;

        while (this.current().type !== 'RBRACE') {
            if (this.current().value === 'case') {
                this.consume('KEYWORD', 'case');
                const condition = this.parseExpression(); // 条件值 e.g., "en"
                this.consume('ARROW');
                const action = this.parsePipeline();
                cases.push({ condition, action });
            } else if (this.current().value === 'default') {
                this.consume('KEYWORD', 'default');
                this.consume('ARROW');
                defaultAction = this.parsePipeline();
            }
            // 忽略块内的换行
            while (this.current().type === 'NEWLINE') {
                this.consume();
            }
        }
        this.consume('RBRACE');
        return { cases, defaultAction };
    }
}

module.exports = { ChainParser };