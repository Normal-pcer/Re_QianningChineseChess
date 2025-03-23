import { AttributeModifier } from "./attributeProvider.js";
import { StatusEffect } from "./effect.js";
import { round } from "./round.js";
/**
 * 一个便利基类，用于创建一些相似的状态效果。
 * 可以看作工厂类。
 */
export class StatusEffectTemplate {
    name;
    id;
    negative = false;
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }
    setAsNegative() {
        this.negative = true;
        return this;
    }
    isNegative() {
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
    apply(target, level, expire = Infinity, expireOffset = -1) {
        let realExpire = expireOffset !== null ? expireOffset + round + expire : expire;
        let modifiers = this.onApply(target, level, realExpire);
        let effect = new StatusEffect(this.name, this.id, this.getDescription(level), modifiers, level, expire);
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
    getDescription(level) {
        return `攻击力提升 ${Math.round(5 + level * 10)}%`;
    }
    onApply(target, level, expire) {
        let modifier = new AttributeModifier((5 + level * 10) / 100, expire, null);
        target.attackDamage.area(1).modify(modifier);
        return [modifier];
    }
}
//# sourceMappingURL=effectTemplate.js.map