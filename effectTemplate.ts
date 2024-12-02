import { AttributeModifier } from "./attributeProvider.js";
import { StatusEffect } from "./effect.js";
import { Piece } from "./piece.js";
import { round } from "./round.js";

export class StatusEffectTemplate {
    name: string;
    id: string;
    descriptionCallback: (level: number) => string;
    applyCallback: (target: Piece, level: number, expire: number) => AttributeModifier<any>[];
    continuedAction: ((target: Piece, level: number) => void) | null = null;
    negative: boolean = false;

    constructor(
        name: string,
        id: string,
        descriptionCallback: (level: number) => string,
        applyCallback: (target: Piece, level: number, expire: number) => AttributeModifier<any>[],
        continuedAction: ((target: Piece, level: number) => void) | null = null
    ) {
        this.name = name;
        this.id = id;
        this.descriptionCallback = descriptionCallback;
        this.applyCallback = applyCallback;
        this.continuedAction = continuedAction;
    }

    setAsNegative() {
        this.negative = true;
        return this;
    }

    apply(target: Piece, level: number = 1, expire: number = Infinity, expireOffset: number | null = -1) {
        let realExpire = expireOffset !== null ? expireOffset + round + expire : expire;
        let modifiers = this.applyCallback(target, level, realExpire);
        let effect = new StatusEffect(this.name, this.id, this.descriptionCallback(level), modifiers, level, expire);
        effect.continuedAction = this.continuedAction ? (piece: Piece) => this.continuedAction?.(piece, level) : null;
        if (this.negative) {
            effect.setAsNegative();
        }
        target.pushEffects(effect);
    }
}

export const StrengthEffectTemplate = new StatusEffectTemplate(
    "力量",
    "strength",
    (level) => `攻击力提升${Math.round(5 + level * 10)}%`,
    (target, level, expire) => {
        return [target.attackDamage.area(1).modify(new AttributeModifier((5 + level * 10) / 100, expire, null))];
    }
);

export const WeaknessEffectTemplate = new StatusEffectTemplate(
    "虚弱",
    "weakness",
    (level) => `攻击力降低${Math.round(10 + level * 10)}%`,
    (target, level, expire) => {
        return [target.attackDamage.area(1).modify(new AttributeModifier((-10 - level * 10) / 100, expire, null))];
    }
).setAsNegative();

export const RegenerationEffectTemplate = new StatusEffectTemplate(
    "再生",
    "regeneration",
    (level) => `每回合回复${3 + level * 3}%生命值`,
    (target, level, expire) => {
        return [];
    },
    (target: Piece, level: number) => {
        let increasing = (3 + level * 3) / 100;
        target.health = Math.min(target.maxHealth.result, target.health + target.maxHealth.result * increasing);
    }
);
