import { AttributeModifier } from "./attributeProvider.js";
import { StatusEffect, TickActionStrategy } from "./effect.js";
import { Piece } from "./piece.js";
import { round } from "./round.js";
import { TypeRegistry } from "./serialize.js";

/**
 * 一个便利基类，用于创建一些相似的状态效果。
 * 可以看作工厂类。
 */
export abstract class StatusEffectTemplate {
    readonly name: string;
    readonly id: string;
    private negative: boolean = false;

    abstract onApply(target: Piece, level: number, expire: number): AttributeModifier<any>[];
    abstract getDescription(level: number): string;
    createTickAction(level: number): TickActionStrategy | null {
        return null;
    }
    constructor(name: string, id: string) {
        this.name = name;
        this.id = id;
    }

    setAsNegative(): StatusEffectTemplate {
        this.negative = true;
        return this;
    }

    isNegative(): boolean {
        return this.negative;
    }

    /**
     * 创建一个状态效果实例。
     * @param level 状态效果等级。
     * @param expire 状态效果过期时间。
     * @param expireOffset 状态效果过期时间偏移量。
     *
     * expire 和 expireOffset 的具体含义，见 StatusEffect 类的文档。
     */
    apply(
        target: Piece,
        level: number,
        expire: number = Infinity,
        expireOffset: number | null = -1
    ) {
        let realExpire = expireOffset !== null ? expireOffset + round + expire : expire;

        let modifiers = this.onApply(target, level, realExpire);
        let effect = new StatusEffect(
            this.name,
            this.id,
            this.getDescription(level),
            modifiers,
            level,
            expire
        );

        let tickAction = this.createTickAction(level);
        if (tickAction !== null) {
            effect.setTickAction(tickAction);
        }

        if (this.isNegative()) {
            effect.setAsNegative();
        }
        target.pushEffects(effect);
    }
}

export class StrengthEffectTemplate extends StatusEffectTemplate {
    constructor() {
        super("力量", "strength");
    }

    getDescription(level: number): string {
        return `攻击力提升 ${Math.round(5 + level * 10)}%`;
    }

    onApply(target: Piece, level: number, expire: number): AttributeModifier<any>[] {
        let modifier = new AttributeModifier((5 + level * 10) / 100, expire, null);
        target.attackDamage.area(1).modify(modifier);
        return [modifier];
    }
}

export class WeaknessEffectTemplate extends StatusEffectTemplate {
    constructor() {
        super("虚弱", "weakness");
    }

    getDescription(level: number): string {
        return `攻击力降低 ${Math.round(10 + level * 10)}`;
    }

    onApply(target: Piece, level: number, expire: number): AttributeModifier<any>[] {
        let modifier = new AttributeModifier((10 + level * 10) / 100, expire, null);
        target.attackDamage.area(1).modify(modifier);
        return [modifier];
    }
}

@TypeRegistry.register()
class RegenerationTickAction extends TickActionStrategy {
    readonly level: number;
    constructor(level: number) {
        super();
        this.level = level;
    }
    action(target: Piece): void {
        let limit = target.maxHealth.result;
        let scale = 0.03 + this.level * 0.03;
        target.health = Math.min(target.health + scale * limit, limit);
    }
}

export class RegenerationEffectTemplate extends StatusEffectTemplate {
    constructor() {
        super("生命恢复", "regeneration");
    }

    getDescription(level: number): string {
        return `攻击力降低 ${Math.round(10 + level * 10)}`;
    }

    onApply(target: Piece, level: number, expire: number): AttributeModifier<any>[] {
        let modifier = new AttributeModifier((10 + level * 10) / 100, expire, null);
        target.attackDamage.area(1).modify(modifier);
        return [modifier];
    }

    createTickAction(level: number): TickActionStrategy | null {
        return new RegenerationTickAction(level);
    }
}
