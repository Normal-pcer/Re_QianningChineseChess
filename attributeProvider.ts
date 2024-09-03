import { round } from "./round.js";

export const operaPlus = (arg1: number, arg2: number) => arg1 + arg2;
export const operaOverride = (arg1: any, arg2: any) => arg2;

/**
 * 属性提供器
 * 如果T不是数字，则只有首个乘区会生效
 */
export class AttributeProvider<T = number> {
    multiplicationAreas: MultiplicationArea<T>[] = [];

    constructor(base: T) {
        this.multiplicationAreas.push(new MultiplicationArea(base, "Base"));
        if (typeof base === "number") {
            this.multiplicationAreas.push(new MultiplicationArea(1, "Improve") as any);
        }
    }

    get result(): T {
        let result = 1;
        let numberProvider = true;
        for (let area of this.multiplicationAreas) {
            if (typeof area.result == "number") {
                result *= area.result;
            } else {
                numberProvider = false;
                break;
            }
        }
        if (!numberProvider) {
            return this.multiplicationAreas[0].result;
        }
        return result as any;
    }

    area(index: number) {
        if (typeof this.multiplicationAreas[0].base !== "number") {
            return this.multiplicationAreas[0];
        }
        while (index >= this.multiplicationAreas.length) {
            let area = new MultiplicationArea<T>(1 as any);
            this.multiplicationAreas.push(area);
        }
        return this.multiplicationAreas[index];
    }
}

class MultiplicationArea<T> {
    base: T;
    modifiers: AttributeModifier<T>[] = [];
    description: string = "";

    constructor(base: T, description = "", modifiers: AttributeModifier<T>[] = []) {
        this.base = base;
        this.modifiers = modifiers;
        this.description = description;
    }

    modify(attributeModifier: AttributeModifier<T>) {
        this.modifiers.push(attributeModifier);
    }

    get result() {
        let result = this.base;
        for (let modifier of this.modifiers) {
            if (modifier.enabled && (modifier.expire == -1 || modifier.expire >= round)) {
                console.log(modifier, "expire: ", modifier.expire);
                result = modifier.operation(result, modifier.amount);
            }
        }
        return result;
    }
}

export class AttributeModifier<T> {
    amount: T;
    expire: number = -1; // -1 表示永不过期
    operation: (arg1: T, arg2: T) => T;
    enabled: boolean = true;

    /**
     * 如果operation为null，则会应用如下默认操作：
     * 1. 如果T是数字，则使用加法
     * 2. 如果T不是数字，则使用覆盖
     *
     * @param expireOffset -当为数字时，表示参数expire的偏移量，此时实际过期时间为当前时间之后再经过
     * ($expire-$expireOffset)回合；当为null时，表示参数expire直接作为过期回合号
     */
    constructor(
        amount: T,
        expire: number = -1,
        expireOffset: number | null = -1,
        operation: null | ((arg1: T, arg2: T) => T) = null
    ) {
        this.amount = amount;
        if (operation === null) {
            if (typeof amount == "number") {
                this.operation = operaPlus as any;
            } else {
                this.operation = operaOverride;
            }
        } else {
            this.operation = operation;
        }
        if (expireOffset === null) this.expire = expire;
        else this.expire = expire === -1 ? -1 : round + expire + expireOffset;
    }
}
