import { round } from "./round.js";
export class AttributeProvider {
    multiplicationAreas = [];
    constructor(base) {
        this.multiplicationAreas.push(new MultiplicationArea(base));
    }
    get result() {
        let result = 1;
        for (let area of this.multiplicationAreas) {
            result *= area.result;
        }
        return result;
    }
}
class MultiplicationArea {
    base = 1;
    modifiers = [];
    constructor(base, modifiers = []) {
        this.base = base;
        this.modifiers = modifiers;
    }
    modify(attributeModifier) {
        this.modifiers.push(attributeModifier);
    }
    get result() {
        let result = this.base;
        for (let modifier of this.modifiers) {
            if (modifier.expire == -1 || modifier.expire >= round) {
                result += modifier.amount;
            }
        }
        return result;
    }
}
export class AttributeModifier {
    amount = 0;
    expire = -1; // -1 表示永不过期
    constructor(amount, expire = -1) {
        this.amount = amount;
        this.expire = expire;
    }
}
//# sourceMappingURL=attributeProvider.js.map