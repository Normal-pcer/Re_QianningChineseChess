import { AttributeModifier } from "./attributeProvider.js";
import { StatusEffect } from "./effect.js";
import { round } from "./round.js";
export class StatusEffectTemplate {
    name;
    id;
    descriptionCallback;
    applyCallback;
    continuedAction = null;
    negative = false;
    constructor(name, id, descriptionCallback, applyCallback, continuedAction = null) {
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
    apply(target, level = 1, expire = Infinity, expireOffset = -1) {
        let modifiers = this.applyCallback(target, level, expireOffset !== null ? expireOffset + round + expire : expire);
        let effect = new StatusEffect(this.name, this.id, this.descriptionCallback(level), modifiers, level);
        effect.continuedAction = this.continuedAction;
        if (this.negative) {
            effect.setAsNegative();
        }
        target.pushEffects(effect);
    }
}
export const StrengthEffectTemplate = new StatusEffectTemplate("力量", "strength", (level) => `攻击力提升${Math.round(5 + level * 10)}%`, (target, level, expire) => {
    return [
        target.attackDamage
            .area(1)
            .modify(new AttributeModifier((5 + (level * 10)) / 100, expire, null)),
    ];
});
export const WeaknessEffectTemplate = new StatusEffectTemplate("虚弱", "weakness", (level) => `攻击力降低${Math.round(10 + level * 10)}%`, (target, level, expire) => {
    return [
        target.attackDamage
            .area(1)
            .modify(new AttributeModifier((-10 - level * 10) / 100, expire, null)),
    ];
}).setAsNegative();
//# sourceMappingURL=effectTemplate.js.map