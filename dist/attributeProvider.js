import { round } from "./round.js";
export const operaPlus = (arg1, arg2) => arg1 + arg2;
export const operaOverride = (arg1, arg2) => arg2;
/**
 * 属性提供器
 * 如果T不是数字，则只有首个乘区会生效
 */
export class AttributeProvider {
    multiplicationAreas = [];
    constructor(base) {
        this.multiplicationAreas.push(new MultiplicationArea(base, "Base"));
        if (typeof base === "number") {
            this.multiplicationAreas.push(new MultiplicationArea(1, "Improve"));
        }
    }
    get result() {
        let result = 1;
        let numberProvider = true;
        for (let area of this.multiplicationAreas) {
            if (typeof area.result == "number") {
                result *= area.result;
            }
            else {
                numberProvider = false;
                break;
            }
        }
        if (!numberProvider) {
            return this.multiplicationAreas[0].result;
        }
        return result;
    }
    area(index) {
        if (typeof this.multiplicationAreas[0] !== "number") {
            return this.multiplicationAreas[0];
        }
        while (index >= this.multiplicationAreas.length) {
            let area = new MultiplicationArea(1);
            this.multiplicationAreas.push(area);
        }
        return this.multiplicationAreas[index];
    }
}
class MultiplicationArea {
    base;
    modifiers = [];
    description = "";
    constructor(base, description = "", modifiers = []) {
        this.base = base;
        this.modifiers = modifiers;
        this.description = description;
    }
    modify(attributeModifier) {
        this.modifiers.push(attributeModifier);
    }
    get result() {
        let result = this.base;
        for (let modifier of this.modifiers) {
            if (modifier.enabled && (modifier.expire == -1 || modifier.expire >= round)) {
                result = modifier.operation(result, modifier.amount);
            }
        }
        return result;
    }
}
export class AttributeModifier {
    amount;
    expire = -1; // -1 表示永不过期
    operation;
    enabled = true;
    /**
     * 如果operation为null，则会应用如下默认操作：
     * 1. 如果T是数字，则使用加法
     * 2. 如果T不是数字，则使用覆盖
     */
    constructor(amount, expire = -1, operation = null) {
        this.amount = amount;
        if (operation === null) {
            if (typeof amount == "number") {
                this.operation = operaPlus;
            }
            else {
                this.operation = operaOverride;
            }
        }
        else {
            this.operation = operation;
        }
        this.expire = expire === -1 ? -1 : round + expire;
    }
}
//# sourceMappingURL=attributeProvider.js.map