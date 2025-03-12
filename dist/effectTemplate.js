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
        let realExpire = expireOffset !== null ? expireOffset + round + expire : expire;
        let modifiers = this.applyCallback(target, level, realExpire);
        let effect = new StatusEffect(this.name, this.id, this.descriptionCallback(level), modifiers, level, expire);
        effect.continuedAction = this.continuedAction ? (piece) => this.continuedAction?.(piece, level) : null;
        if (this.negative) {
            effect.setAsNegative();
        }
        target.pushEffects(effect);
    }
}
export const StrengthEffectTemplate = new StatusEffectTemplate("力量", "strength", (level) => `攻击力提升${Math.round(5 + level * 10)}%`, (target, level, expire) => {
    return [target.attackDamage.area(1).modify(new AttributeModifier((5 + level * 10) / 100, expire, null))];
});
export const WeaknessEffectTemplate = new StatusEffectTemplate("虚弱", "weakness", (level) => `攻击力降低${Math.round(10 + level * 10)}%`, (target, level, expire) => {
    return [target.attackDamage.area(1).modify(new AttributeModifier((-10 - level * 10) / 100, expire, null))];
}).setAsNegative();
export const RegenerationEffectTemplate = new StatusEffectTemplate("再生", "regeneration", (level) => `每回合回复${3 + level * 3}%生命值`, (target, level, expire) => {
    return [];
}, (target, level) => {
    let increasing = (3 + level * 3) / 100;
    target.health = Math.min(target.maxHealth.result, target.health + target.maxHealth.result * increasing);
});
export const PotionEffectTemplate = new StatusEffectTemplate("剧毒", "potion", (level) => `每回合减少${3 + level * 3}%生命值，至多减至10%`, (target, level, expire) => {
    return [];
}, (target, level) => {
    let decreasing = (3 + level * 3) / 100;
    let limit = target.maxHealth.result / 10;
    if (target.health >= limit) {
        target.health = Math.max(limit, target.health - target.maxHealth.result * decreasing);
    }
}).setAsNegative();
//# sourceMappingURL=effectTemplate.js.map