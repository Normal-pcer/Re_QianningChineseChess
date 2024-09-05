import { registerAnonymous } from "./callbackRegister.js";
import { round } from "./round.js";
let attributeModifierId = 0;
export const operaPlus = registerAnonymous((arg1, arg2) => arg1 + arg2, "ModifierOperaPlus");
export const operaOverride = registerAnonymous((arg1, arg2) => arg2, "ModifierOperaOverride");
export const modifiers = {};
export class AttributeProvider {
    multiplicationAreas;
    constructor(base) {
        this.multiplicationAreas = [];
        this.multiplicationAreas.push(new MultiplicationArea(base, "Base"));
    }
    get result() {
        return this.multiplicationAreas[0].result;
    }
    area(index) {
        return this.multiplicationAreas[0];
    }
}
/**
 * 属性提供器
 * 如果T不是数字，则只有首个乘区会生效
 */
export class NumberAttributeProvider extends AttributeProvider {
    constructor(base) {
        super(base);
        this.multiplicationAreas.push(new MultiplicationArea(1, "Improve"));
    }
    get result() {
        let result = 1;
        for (let area of this.multiplicationAreas) {
            result *= area.result;
        }
        return result;
    }
    area(index) {
        while (index >= this.multiplicationAreas.length) {
            let area = new MultiplicationArea(1);
            this.multiplicationAreas.push(area);
        }
        return this.multiplicationAreas[index];
    }
    toExpression(round = true) {
        let base = this.area(0).result;
        let total = this.result;
        let improve = total - base;
        if (round) {
            base = Math.round(base);
            improve = Math.round(improve);
            total = Math.round(total);
        }
        if (improve == 0)
            return `${base}`;
        else
            return `${base} + ${improve} = ${total}`;
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
            if (!modifier.enabled) {
                if (modifier.clearOnDisable)
                    this.modifiers.splice(this.modifiers.indexOf(modifier), 1);
            }
            else if (modifier.expire !== -1 && modifier.expire < round) {
                if (modifier.clearOnExpire)
                    this.modifiers.splice(this.modifiers.indexOf(modifier), 1);
            }
            else {
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
    clearOnExpire = true;
    clearOnDisable = true;
    id;
    /**
     * 如果operation为null，则会应用如下默认操作：
     * 1. 如果T是数字，则使用加法
     * 2. 如果T不是数字，则使用覆盖
     *
     * @param expireOffset -当为数字时，表示参数expire的偏移量，此时实际过期时间为当前时间之后再经过
     * ($expire-$expireOffset)回合；当为null时，表示参数expire直接作为过期回合号
     * @param numberModifier - 如果为true，则amount会被优先视为数字，否则视为普通值；如果amount不是数字，则该参数无效
     */
    constructor(amount, expire = -1, expireOffset = -1, operation = null, numberModifier = true, clearOnExpire = true, clearOnDisable = true) {
        this.amount = amount;
        if (operation === null) {
            if (typeof amount == "number" && numberModifier) {
                this.operation = operaPlus;
            }
            else {
                this.operation = operaOverride;
            }
        }
        else {
            this.operation = operation;
        }
        if (expireOffset === null)
            this.expire = expire;
        else
            this.expire = expire === -1 ? -1 : round + expire + expireOffset;
        this.clearOnExpire = clearOnExpire;
        this.clearOnDisable = clearOnDisable;
        while (modifiers[attributeModifierId] !== undefined) {
            attributeModifierId++;
        }
        this.id = attributeModifierId;
        modifiers[attributeModifierId] = this;
        attributeModifierId++;
    }
}
export function getAttributeModifierById(id) {
    return modifiers[id];
}
//# sourceMappingURL=attributeProvider.js.map