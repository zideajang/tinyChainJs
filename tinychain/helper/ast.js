/**
 * LinkLang AST Node Definitions
 * * 使用 JavaScript Class 定义抽象语法树的节点结构。
 */

// 基础 AST 节点
class ASTNode {
    constructor(type) {
        this.type = type;
    }
}

// ------------------- 字面量和标识符 -------------------

class Literal extends ASTNode {
    constructor(value, valueType) {
        super('Literal');
        this.value = value;      // 实际值
        this.valueType = valueType; // 'string', 'number', 'boolean'
    }
}

class Identifier extends ASTNode {
    constructor(name) {
        super('Identifier');
        this.name = name; // e.g., 'general_llm', 'Input'
    }
}

class ListLiteral extends ASTNode {
    constructor(items) {
        super('ListLiteral');
        this.items = items; // Array of ASTNode
    }
}

class ObjectLiteral extends ASTNode {
    constructor(fields) {
        super('ObjectLiteral');
        this.fields = fields; // Map of {key: ASTNode}
    }
}


// ------------------- 表达式和结构 -------------------

class FunctionCall extends ASTNode {
    constructor(name, args) {
        super('FunctionCall');
        this.name = name;   // 函数名/组件类型, e.g., 'Model', 'Builtin'
        this.args = args;   // Map of {argName: ASTNode}
    }
}

class BindExpression extends ASTNode {
    constructor(target, modifier) {
        super('BindExpression');
        this.target = target;     // 被绑定的表达式 (e.g., Identifier, FunctionCall)
        this.modifier = modifier; // 绑定修饰符 (FunctionCall, e.g., output(Schema))
    }
}

class Pipeline extends ASTNode {
    constructor(steps) {
        super('Pipeline');
        this.steps = steps; // Array of ASTNode connected by >>
    }
}

// ------------------- 语句 (顶层定义) -------------------

class DefStatement extends ASTNode {
    constructor(name, value) {
        super('DefStatement');
        this.name = name; // 定义的名称
        this.value = value; // 赋值的内容 (e.g., FunctionCall, BindExpression, RouterBlock)
    }
}

class ChainStatement extends ASTNode {
    constructor(name, pipeline, context = null) {
        super('ChainStatement');
        this.name = name;
        this.pipeline = pipeline;
        this.context = context; // 可选的上下文，如 with memory(...)
    }
}

class SchemaStatement extends ASTNode {
    constructor(name, fields) {
        super('SchemaStatement');
        this.name = name;
        this.fields = fields; // Array of {name: string, type: string}
    }
}

class Program extends ASTNode {
    constructor(statements) {
        super('Program');
        this.statements = statements; // 包含所有 Def, Chain, Schema Statements
    }
}

// 导出所有节点
module.exports = {
    ASTNode, Program, DefStatement, ChainStatement, SchemaStatement,
    Pipeline, BindExpression, FunctionCall,
    Identifier, Literal, ListLiteral, ObjectLiteral
};