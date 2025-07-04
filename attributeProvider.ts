import { registerAnonymous } from "./callbackRegister.js";
import { round } from "./round.js";
import { Serializable, TypeRegistry } from "./serialize.js";

let attributeModifierId = 0;

abstract class MergeStrategy<T> extends Serializable {
    abstract merge(arg1: T, arg2: T): T;
}

@TypeRegistry.register()
class PlusMergeStategy extends MergeStrategy<number> {
    merge(arg1: number, arg2: number) {
        return arg1 + arg2;
    }
}

@TypeRegistry.register()
class OverrideMergeStategy extends MergeStrategy<any> {
    merge(arg1: any, arg2: any) {
        return arg2;
    }
}

export const modifiers: { [key: number]: AttributeModifier<any> } = {};

export class AttributeProvider<T> {
    multiplicationAreas: MultiplicationArea<T>[];

    constructor(base: T) {
        this.multiplicationAreas = [];
        this.multiplicationAreas.push(new MultiplicationArea(base, "Base"));
    }

    get result() {
        return this.multiplicationAreas[0].result;
    }

    area(index: number) {
        return this.multiplicationAreas[0];
    }
}

/**
 * 属性提供器
 * 如果 T 不是数字，则只有首个乘区会生效
 */
export class NumberAttributeProvider extends AttributeProvider<number> {
    constructor(base: number) {
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

    area(index: number) {
        while (index >= this.multiplicationAreas.length) {
            let area = new MultiplicationArea<number>(1);
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
        if (improve == 0) return `${base}`;
        else if (improve > 0) return `${base} + ${improve} = ${total}`;
        else return `${base} - ${-improve} = ${total}`;
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
        return attributeModifier;
    }

    modified(...attributeModifiers: AttributeModifier<T>[]) {
        for (let modifier of attributeModifiers) {
            this.modifiers.push(modifier);
        }
        return this;
    }

    get result() {
        let result = this.base;
        for (let modifier of this.modifiers) {
            if (!modifier.enabled) {
                if (modifier.clearOnDisable)
                    this.modifiers.splice(this.modifiers.indexOf(modifier), 1);
            } else if (modifier.expire < round) {
                if (modifier.clearOnExpire)
                    this.modifiers.splice(this.modifiers.indexOf(modifier), 1);
            } else {
                result = modifier.operation.merge(result, modifier.amount);
            }
        }
        return result;
    }
}

export class AttributeModifier<T> {
    amount: T;
    expire: number = Infinity;
    operation: MergeStrategy<T>;
    enabled: boolean = true;
    clearOnExpire: boolean = true;
    clearOnDisable: boolean = true;
    id: number;

    /**
     * 如果operation为null，则会应用如下默认操作：
     * 1. 如果T是数字，则使用加法
     * 2. 如果T不是数字，则使用覆盖
     *
     * @param expireOffset -当为数字时，表示参数expire的偏移量，此时实际过期时间为当前时间之后再经过
     * ($expire-$expireOffset)回合；当为null时，表示参数expire直接作为过期回合号
     * @param numberModifier - 如果为true，则amount会被优先视为数字，否则视为普通值；如果amount不是数字，则该参数无效
     */
    constructor(
        amount: T,
        expire: number = Infinity,
        expireOffset: number | null = -1,
        operation: null | MergeStrategy<T> = null,
        numberModifier: boolean = true,
        clearOnExpire: boolean = true,
        clearOnDisable: boolean = true
    ) {
        this.amount = amount;
        if (operation === null) {
            if (typeof amount === "number" && numberModifier) {
                this.operation = new PlusMergeStategy() as any;
            } else {
                this.operation = new OverrideMergeStategy();
            }
        } else {
            this.operation = operation;
        }
        if (expireOffset === null) this.expire = expire;
        else this.expire = round + expire + expireOffset;
        this.clearOnExpire = clearOnExpire;
        this.clearOnDisable = clearOnDisable;

        while (modifiers[attributeModifierId] !== undefined) {
            attributeModifierId++;
        }
        this.id = attributeModifierId;
        modifiers[attributeModifierId] = this;
        attributeModifierId++;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

export function getAttributeModifierById(id: number) {
    return modifiers[id];
}
