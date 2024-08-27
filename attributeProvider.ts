import { round } from "./round.js";

export class AttributeProvider {
    multiplicationAreas: MultiplicationArea[] = [];

    constructor(base: number) {
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
    base: number = 1;
    modifiers: AttributeModifier[] = [];

    constructor(base: number, modifiers: AttributeModifier[] = []) {
        this.base = base;
        this.modifiers = modifiers;
    }

    modify(attributeModifier: AttributeModifier) {
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
    amount: number = 0;
    expire: number = -1;  // -1 表示永不过期

    constructor(amount: number, expire: number = -1) {
        this.amount = amount;
        this.expire = expire;
    }
}
