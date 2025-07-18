import { AttributeModifier, getAttributeModifierById, modifiers } from "./attributeProvider.js";
import { Piece } from "./piece.js";
import { round } from "./round.js";
import { Serializable } from "./serialize.js";

const ROMAN_NUMBER_LIMIT = 25; // 小于等于此数值的等级将使用罗马数字表示
const toRomanNumber = (number: number) => {
    const HARD_LIMIT = 3999;
    if (number > ROMAN_NUMBER_LIMIT || number > HARD_LIMIT) {
        return number.toString();
    }
    const ones = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    const tens = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];
    const hundreds = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"];
    const thousands = ["", "M", "MM", "MMM"];
    return (
        thousands[Math.floor(number / 1000)] +
        hundreds[Math.floor((number % 1000) / 100)] +
        tens[Math.floor((number % 100) / 10)] +
        ones[Math.floor(number % 10)]
    );
};

/**
 * 策略类，用于指定状态效果在每一轮进行后都需要进行的操作。
 */
export abstract class TickActionStrategy extends Serializable {
    /**
     * 对持有该效果的棋子执行操作。将会在每一轮之后被调用。
     * @param piece 目标棋子。
     */
    abstract action(piece: Piece): void;
}

export class StatusEffect {
    readonly name: string = "";
    readonly id: string = "";
    readonly description: string = "";

    /**
     * 状态效果的等级。
     * 如果为空，表示不应用等级机制。
     */
    readonly level: number | null = null;
    /**
     * 所有相关属性修改器的 ID。
     */
    private relatedModifierIds: number[] = [];
    /**
     * 状态效果的过期时间。请使用 getter 和 setter 操作。
     */
    private expire_: number = Infinity;
    /**
     * 当前状态效果是否启用。
     */
    private enabled: boolean = true;
    /**
     * 是否为负面效果。
     */
    private negative: boolean = false;
    /**
     * 是否展示等级。
     * 如果 level 为 null，忽略此字段。
     */
    private showLevel: boolean = true;
    /**
     * 每一轮结束后希望执行的动作。
     * 将会调用 action 方法。
     */
    private tickAction: TickActionStrategy | null = null;

    /**
     * 构造一个状态效果（StatusEffect）。
     *
     * @param name - 状态效果的名称。
     * @param id - 状态效果的标识符。
     * @param description - 状态效果的描述。
     * @param relatedModifiers - 与该状态效果相关的属性修改器。这些修改器将会根据状态效果本身的状态自动启用或禁用。
     * @param level - 状态效果的等级。如果为 null，将不会应用等级机制。
     * @param expire - 状态效果的到期时间。如果为 null，将会自动推断到期时间。即使用相关属性修改器的最小到期时间。
     * @param expireOffset - 到期时间偏移量。如果为数字，将会在当前时间之后经过 expire - offset 回合后过期；如果为 null，expire 参数直接作为过期回合号，与当前时间无关。
     */
    constructor(
        name: string,
        id: string,
        description: string = "",
        relatedModifiers: AttributeModifier<any>[] = [],
        level: number | null = null,
        expire: number | null = null,
        expireOffset: number | null = -1
    ) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.relatedModifierIds = relatedModifiers.map((modifier) => modifier.id);
        if (expire === null) {
            // 自动推断过期时间
            let minExpire = Math.min(...relatedModifiers.map((modifier) => modifier.expire));
            this.expire = minExpire;
            relatedModifiers.forEach((modifier) => {
                modifier.expire = this.expire;
            });
        } else {
            if (expireOffset === null) this.expire = expire;
            else this.expire = round + expire + expireOffset;
        }
        this.level = level;

        if (this.expire !== Infinity) {
            relatedModifiers.forEach((modifier) => {
                modifier.expire = this.expire;
            });
        }
    }

    get expire(): number {
        return this.expire_;
    }

    /**
     * 设置过期时间。
     * 将会改变所有相关属性修改器的过期时间。
     */
    set expire(value) {
        this.expire_ = value;
        this.relatedModifiers.forEach((modifier) => {
            modifier.expire = value;
        });
    }

    /**
     * 获取所有相关的属性修改器。
     */
    get relatedModifiers(): AttributeModifier<any>[] {
        return this.relatedModifierIds.map((id) => {
            return getAttributeModifierById(id);
        });
    }

    /**
     * 获取效果的显示名称。
     * @returns - 显示名称。类似 {name}{level} 的形式，其中 level 用罗马数字显示或为空。
     */
    displayName(): string {
        if (this.level === null || !this.showLevel) {
            return this.name; // 不展示等级
        }
        let roman = toRomanNumber(this.level);
        return this.name + roman;
    }

    /**
     * 获取效果是否可用。
     */
    get available(): boolean {
        return this.enabled && round <= this.expire;
    }

    /**
     * 启用一个状态效果。
     * 将会一并启用关联的修改器。
     */
    enable(): StatusEffect {
        this.enabled = true;
        this.relatedModifiers.forEach((modifier) => {
            modifier.enable();
        });
        return this;
    }

    /**
     * 禁用一个状态效果。
     * 将会禁用关联的修改器。
     */
    disable(): StatusEffect {
        this.enabled = false;
        this.relatedModifiers.forEach((modifier) => {
            modifier.disable();
        });
        return this;
    }

    /**
     * 将一个状态效果设置为负面。
     * 将会影响渲染方式。
     */
    setAsNegative() {
        this.negative = true;
        return this;
    }

    isNegative(): boolean {
        return this.negative;
    }

    setTickAction(strategy: TickActionStrategy): void {
        this.tickAction = strategy;
    }

    runContinuedAction(target: Piece) {
        if (!this.available) {
            return; // 剔除不可用的效果
        }
        if (this.tickAction !== null) {
            this.tickAction.action(target);
        }
    }
}
