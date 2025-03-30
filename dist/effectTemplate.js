var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { AttributeModifier } from "./attributeProvider.js";
import { StatusEffect, TickActionStrategy } from "./effect.js";
import { round } from "./round.js";
import { TypeRegistry } from "./serialize.js";
/**
 * 一个便利基类，用于创建一些相似的状态效果。
 * 可以看作工厂类。
 */
export class StatusEffectTemplate {
    name;
    id;
    negative = false;
    createTickAction(level) {
        return null;
    }
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
    getDescription(level) {
        return `攻击力提升 ${Math.round(5 + level * 10)}%`;
    }
    onApply(target, level, expire) {
        let modifier = new AttributeModifier((5 + level * 10) / 100, expire, null);
        target.attackDamage.area(1).modify(modifier);
        return [modifier];
    }
}
export class WeaknessEffectTemplate extends StatusEffectTemplate {
    constructor() {
        super("虚弱", "weakness");
    }
    getDescription(level) {
        return `攻击力降低 ${Math.round(10 + level * 10)}`;
    }
    onApply(target, level, expire) {
        let modifier = new AttributeModifier((10 + level * 10) / 100, expire, null);
        target.attackDamage.area(1).modify(modifier);
        return [modifier];
    }
}
let RegenerationTickAction = class RegenerationTickAction extends TickActionStrategy {
    level;
    constructor(level) {
        super();
        this.level = level;
    }
    action(target) {
        let limit = target.maxHealth.result;
        let scale = 0.03 + this.level * 0.03;
        target.health = Math.min(target.health + scale * limit, limit);
    }
};
RegenerationTickAction = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [Number])
], RegenerationTickAction);
export class RegenerationEffectTemplate extends StatusEffectTemplate {
    constructor() {
        super("生命恢复", "regeneration");
    }
    getDescription(level) {
        return `攻击力降低 ${Math.round(10 + level * 10)}`;
    }
    onApply(target, level, expire) {
        let modifier = new AttributeModifier((10 + level * 10) / 100, expire, null);
        target.attackDamage.area(1).modify(modifier);
        return [modifier];
    }
    createTickAction(level) {
        return new RegenerationTickAction(level);
    }
}
//# sourceMappingURL=effectTemplate.js.map