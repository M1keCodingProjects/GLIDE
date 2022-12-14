import      Parser  from "./PARSING/new_parser.js";
import      Editor  from "../EDITOR/editor.js";
import * as StackEl from "./stack operators.js";

const editor = new Editor();
const print = msg => editor.console.appendLog(msg);

const raise = msg => {
    editor.console.appendLog(msg, "Error");
    throw new Error(msg);
}

const mathSymbols = ["+", "-", "*", "/", "**", "and", "or", ">", "<", "==", "<<", ">>"];

export default class Compiler {
    constructor() {
        this.init();
        this.state = "deploy";
        this.parser = new Parser(editor);
        this.editor = editor;
    }

    init() {
        this.AST = [];
        this.reset_runtime();
    }

    reset_runtime() {
        this.vars = [];
    }

    build() {
        this.init();
        this.AST = this.parser.parse_fileContents();
        const expressions = [];
        for(const expr of this.AST) expressions.push(new PrintProc(expr.value));
        if(this.state == "debug") {
            print(JSON.stringify(this.AST, null, 2));
            print("Build complete.");
        }
        
        this.run(expressions);
        if(this.state == "debug") print("Execution complete.");
    }

    async run(expressions) {
        for(const expr of expressions) {
            await expr.exec();
        }
    }
}

// PROCEDURES
class Proc {
    constructor(args) {
        this.buildArgs(args);
    }
}

class PrintProc extends Proc {
    constructor(args) {
        super(args);
    }

    buildArgs(args) {
        this.stackExpr = new StackExpr(args);
    }

    async exec() {
        const result = await this.stackExpr.exec();
        print(result);
    }
}

// STACK
class StackExpr {
    constructor(stackElements) {
        this.stackEls = stackElements.map(stackElm => {
            switch(stackElm.type) {
                case "stackOp": return this.getStackOp(stackElm.value);
                case "num":
                case "str": return new StackValue(stackElm.value);
            }
        });
    }

    getStackOp(symbol) {
        if(mathSymbols.includes(symbol)) {
            switch(symbol) {
                case "+" : return new Plus_stackOp(symbol);
                case "==": return new Eqs_stackOp(symbol);
                default  : return new Math_stackOp(symbol);
            }
        }
        switch(symbol) {
            case "not"  : return new StackEl.Not_stackOp();
            case "dup"  : return new StackEl.Dup_stackOp();
            case "size" : return new StackEl.Size_stackOp(); 
            case "rot<" : return new StackEl.RotL_stackOp();
            case "rot>" : return new StackEl.RotR_stackOp();
            case "spill": return new StackEl.Spill_stackOp();
            case "type" : return new StackEl.Type_stackOp();
            case "swap" : return new StackEl.Swap_stackOp();
            case "drop" : return new StackEl.Drop_stackOp();
            case "pop"  : return new StackEl.Pop_stackOp();
            case "inp"  : return new Inp_stackOp();
        }
    }

    async exec() {
        const stack = [];
        for(const stackEl of this.stackEls) {
            await stackEl.exec(stack);
        }
        return stack.length == 1 ? stack[0] : stack;
    }
}

class StackValue{
    constructor(value) {
        this.value = value;
    }

    exec(stack) {
        stack.push(this.value);
    }
}

class Math_stackOp extends StackEl.StackOp {
    constructor(symbol, required_stackState = ["num", "num"]) {
        super(required_stackState);
        this.exec = this.init_exec(symbol).bind(this);
    }

    get(stack) {
        const el2 = stack.pop();
        const el1 = stack.pop();
        return [el1, el2];
    }

    checkNaN(res) {
        if(isNaN(res)) raise("A math error has occurred inside of a StackExpression.");
    }

    init_exec(symbol) {
        switch(symbol) {
            case "+" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = el1 + el2;
                this.checkNaN(res);
                stack.push(res);
            };

            case "-" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = el1 - el2;
                this.checkNaN(res);
                stack.push(res);
            };

            case "*" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = el1 * el2;
                this.checkNaN(res);
                stack.push(res);
            };

            case "/" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = el1 / el2;
                this.checkNaN(res);
                stack.push(res);
            };

            case "**" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = el1 ** el2;
                this.checkNaN(res);
                stack.push(res);
            };

            case "and" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = 1 * (Boolean(el1) && Boolean(el2));
                this.checkNaN(res);
                stack.push(res);
            };

            case "or" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = 1 * (Boolean(el1) || Boolean(el2));
                this.checkNaN(res);
                stack.push(res);
            };

            case ">" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = 1 * (el1 > el2);
                this.checkNaN(res);
                stack.push(res);
            };

            case "<" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = 1 * (el1 < el2);
                this.checkNaN(res);
                stack.push(res);
            };

            case "==" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = 1 * (el1 === el2);
                this.checkNaN(res);
                stack.push(res);
            };

            case ">>" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = 1 * (el1 >> el2);
                this.checkNaN(res);
                stack.push(res);
            };

            case "<<" : return stack => {
                const [el1, el2] = this.get(stack);
                const res = 1 * (el1 << el2);
                this.checkNaN(res);
                stack.push(res);
            };
        }
    }
}
  
class Plus_stackOp extends Math_stackOp {
    constructor() {
        super("+", ["num|str", "num|str"]);
    }
}

class Eqs_stackOp extends Math_stackOp {
    constructor() {
        super("==", ["num|str|list|obj", "num|str|list|obj"]);
    }
}

class Inp_stackOp extends StackEl.StackOp {
    constructor() {
        super();
    }

    async exec(stack) {
        const userInput = await editor.console.requestInput();
        stack.push(userInput);
    }
}