import { AttributeModifier } from "./attributeProvider.js";
import { Effect } from "./effect.js";
import { Piece } from "./piece.js";
import { round } from "./round.js";

export class EffectTemplate {
    name: string;
    id: string;
    descriptionCallback: (level: number) => string;
    applyCallback: (target: Piece, level: number, expire: number) => AttributeModifier<any>[];
    continuedAction: (() => void) | null = null;
    negative: boolean = false;

    constructor(
        name: string,
        id: string,
        descriptionCallback: (level: number) => string,
        applyCallback: (target: Piece, level: number, expire: number) => AttributeModifier<any>[],
        continuedAction: (() => void) | null = null
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

    apply(
        target: Piece,
        level: number = 1,
        expire: number = Infinity,
        expireOffset: number | null = -1
    ) {
        let modifiers = this.applyCallback(
            target,
            level,
            expireOffset !== null ? expireOffset + round + expire : expire
        );
        let effect = new Effect(
            this.name,
            this.id,
            this.descriptionCallback(level),
            modifiers,
            level
        );
        effect.continuedAction = this.continuedAction;
        if (this.negative) {
            effect.setAsNegative();
        }
        target.pushEffects(effect);
    }
}

export const StrengthEffectTemplate = new EffectTemplate(
    "力量",
    "strength",
    (level) => `攻击力提升${Math.round(5 + level * 10)}%`,
    (target, level, expire) => {
        return [
            target.attackDamage
                .area(1)
                .modify(new AttributeModifier((5 + (level * 10)) / 100, expire, null)),
        ];
    }
);

export const WeaknessEffectTemplate = new EffectTemplate(
    "虚弱",
    "weakness",
    (level) => `攻击力降低${Math.round(10 + level * 10)}%`,
    (target, level, expire) => {
        return [
            target.attackDamage
                .area(1)
                .modify(new AttributeModifier((-10 - level * 10) / 100, expire, null)),
        ];
    }
);
