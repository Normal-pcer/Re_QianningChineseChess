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
import { registerAnonymous } from "./callbackRegister.js";
import { returnCardById } from "./cardLooting.js";
import { DamageType } from "./damageType.js";
import { filterGrids, ray } from "./defaultMovingBehaviors.js";
import { StatusEffect } from "./effect.js";
import { PotionEffectTemplate, RegenerationEffectTemplate, StrengthEffectTemplate, WeaknessEffectTemplate, } from "./effectTemplate.js";
import { Piece, PieceType } from "./piece.js";
import { PieceActionStrategy, PieceAttackingStrategy, PieceMovingStrategy, } from "./pieceStrategy.js";
import { getCurrentSelection, ItemType, SelectionManager, setCurrentSelection, SingleSelection, } from "./selection.js";
import { Serializable, TypeRegistry } from "./serialize.js";
import { TriggerManager, DamageTrigger } from "./trigger.js";
import { Vector2 } from "./vector.js";
/**
 * 行为卡。
 * 在使用时调用 onApply() 方法。
 */
export class ActionCard extends Serializable {
    name;
    id;
    description;
    enabled = true;
    constructor(name, id, description) {
        super();
        this.name = name;
        this.id = id;
        this.description = description;
    }
    apply() {
        this.onApply();
    }
}
let TestActionCard = class TestActionCard extends ActionCard {
    constructor() {
        super("测试卡牌", "test", "这是一个测试卡牌");
    }
    onApply() {
        console.log("使用测试卡牌");
    }
};
TestActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], TestActionCard);
export { TestActionCard };
/**
 * 进行一次单选棋子，然后进行接下来的操作。
 * pieceType 成员指定棋子类型，null 表示没有限制
 */
export class SelectorActionCard extends ActionCard {
    pieceType;
    constructor(name, id, description, pieceType = PieceType.None) {
        super(name, id, description);
        this.pieceType = pieceType;
    }
    onApply() {
        // 进行一次选择
        let currentSelection = getCurrentSelection();
        // 新的选择
        let targetSelection = new SelectionManager(new SingleSelection([], ItemType.Piece, `请选择要应用「${this.name}」的棋子`, (item) => {
            if (item.data instanceof Piece) {
                return (item.data.type === this.pieceType || this.pieceType === PieceType.None);
            }
            return false;
        }))
            .once() // 只能选择一次
            .oncancel((_) => {
            returnCardById(this.id);
        })
            .replaceWithFinally(currentSelection) // 回到当前选择
            .final((result) => {
            let target = result[0].data;
            if (target instanceof Piece) {
                this.final(target);
            }
        });
        setCurrentSelection(targetSelection);
    }
}
let StrengthPotionActionCard = class StrengthPotionActionCard extends SelectorActionCard {
    constructor() {
        super("力量药水", "streangthPotion", "持续 3 回合-选中棋子的攻击力提升 15%");
    }
    final(target) {
        let factory = new StrengthEffectTemplate();
        factory.apply(target, 1, 3 * 2);
    }
};
StrengthPotionActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], StrengthPotionActionCard);
export { StrengthPotionActionCard };
let HighGunAttackingStrategy = class HighGunAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece) {
        return ray(piece.position, new Vector2(1, 0), 2, 1).concat(ray(piece.position, new Vector2(-1, 0), 2, 1), ray(piece.position, new Vector2(0, 1), 2, 1), ray(piece.position, new Vector2(0, -1), 2, 1));
    }
};
HighGunAttackingStrategy = __decorate([
    TypeRegistry.register()
], HighGunAttackingStrategy);
// ? 为什么要这么实现
let HighGunActionCardEndTrigger = class HighGunActionCardEndTrigger extends DamageTrigger {
    pieceElement;
    effect;
    constructor(pieceElement, effect) {
        super();
        this.pieceElement = pieceElement;
        this.effect = effect;
    }
    action(damage) {
        if (damage.source?.htmlElement === this.pieceElement && this.pieceElement !== null) {
            this.effect.disable();
        }
    }
};
HighGunActionCardEndTrigger = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [Object, StatusEffect])
], HighGunActionCardEndTrigger);
export { HighGunActionCardEndTrigger };
/**
 * 高射炮。
 */
let HighGunActionCard = class HighGunActionCard extends SelectorActionCard {
    constructor() {
        super("高射炮", "highGun", "下一次攻击允许间隔至多两个棋子", PieceType.Gun);
    }
    final(piece) {
        let modifier = new AttributeModifier(new HighGunAttackingStrategy());
        piece.attackingTargetsCallback.area(0).modify(modifier);
        let effect = new StatusEffect("高射炮", "highGun", "下一次攻击允许间隔至多两个棋子", [
            modifier,
        ]);
        piece.pushEffects(effect);
        let pieceElement = piece.htmlElement;
        TriggerManager.addTrigger(new HighGunActionCardEndTrigger(pieceElement, effect));
    }
};
HighGunActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], HighGunActionCard);
export { HighGunActionCard };
/**
 * “一马平川”状态下的马的移动、攻击策略
 */
let LimitlessHorseMovingStrategy = class LimitlessHorseMovingStrategy extends PieceMovingStrategy {
    getPosition(piece) {
        return filterGrids((pos) => piece.position.manhattanDistance(pos) == 3 &&
            piece.position.chebyshevDistance(pos) == 2);
    }
};
LimitlessHorseMovingStrategy = __decorate([
    TypeRegistry.register()
], LimitlessHorseMovingStrategy);
let LimitlessHorseAttackingStrategy = class LimitlessHorseAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece) {
        return filterGrids((pos) => piece.position.manhattanDistance(pos) == 3 &&
            piece.position.chebyshevDistance(pos) == 2);
    }
};
LimitlessHorseAttackingStrategy = __decorate([
    TypeRegistry.register()
], LimitlessHorseAttackingStrategy);
let LimitlessHorseActionCard = class LimitlessHorseActionCard extends SelectorActionCard {
    constructor() {
        super("一马平川", "limitlessHorse", "持续 3 回合 - 马的行动不再受「蹩马腿」限制", PieceType.Horse);
    }
    final(target) {
        let attackingModifier = new AttributeModifier(new LimitlessHorseAttackingStrategy(), 3 * 2);
        let movingModifier = new AttributeModifier(new LimitlessHorseMovingStrategy(), 3 * 2);
        let effect = new StatusEffect("一马平川", "limitlessHorse", "马的行动不再受「蹩马腿」限制", [attackingModifier, movingModifier]);
        target.pushEffects(effect);
        target.attackingTargetsCallback.area(0).modify(attackingModifier);
        target.movingDestinationsCallbackProvider.area(0).modify(movingModifier);
    }
};
LimitlessHorseActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], LimitlessHorseActionCard);
export { LimitlessHorseActionCard };
let WeaknessPotionActionCard = class WeaknessPotionActionCard extends SelectorActionCard {
    constructor() {
        super("虚弱药水", "weaknessPotion", "持续 3 回合 - 选中棋子的攻击力降低 20%");
    }
    final(target) {
        new WeaknessEffectTemplate().apply(target, 1);
    }
};
WeaknessPotionActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], WeaknessPotionActionCard);
export { WeaknessPotionActionCard };
let InstantHealthPotionActionCard = class InstantHealthPotionActionCard extends SelectorActionCard {
    constructor() {
        super("治疗药水", "instantHealthPotion", "选中棋子回复 600 点生命值");
    }
    final(target) {
        target.health = Math.min(target.health + 600, target.maxHealth.result);
        target.draw(); // 直接重绘棋子
    }
};
InstantHealthPotionActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], InstantHealthPotionActionCard);
export { InstantHealthPotionActionCard };
let RegenerationPotionActionCard = class RegenerationPotionActionCard extends SelectorActionCard {
    constructor() {
        super("再生药水", "regenerationPotion", "持续 3 回合 - 选中棋子每回合回复 6% 生命值");
    }
    final(target) {
        new RegenerationEffectTemplate().apply(target, 1, 3 * 2);
    }
};
RegenerationPotionActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], RegenerationPotionActionCard);
export { RegenerationPotionActionCard };
let PotionPotionActionCard = class PotionPotionActionCard extends SelectorActionCard {
    constructor() {
        super("剧毒药水", "potionPotion", "持续 3 回合 - 每轮造成 3% 生命值上限 + 40 的魔法伤害。至多使生命值降低到 5%。");
    }
    final(target) {
        new PotionEffectTemplate().apply(target, 1, 3 * 2);
    }
};
PotionPotionActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], PotionPotionActionCard);
export { PotionPotionActionCard };
let PotionPotionEnhancedActionCard = class PotionPotionEnhancedActionCard extends SelectorActionCard {
    constructor() {
        super("剧毒药水（加强）", "potionPotionEnhanced", "持续 2 回合 - 每轮造成 5% 生命值上限 + 80 的魔法伤害。至多使生命值降低到 5%。");
    }
    final(target) {
        new PotionEffectTemplate().apply(target, 2, 2 * 2);
    }
};
PotionPotionEnhancedActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], PotionPotionEnhancedActionCard);
export { PotionPotionEnhancedActionCard };
let StrengthPotionEnhancedActionCard = class StrengthPotionEnhancedActionCard extends SelectorActionCard {
    constructor() {
        super("力量药水（加强）", "strengthPotionEnhanced", "持续 2 回合 - 选中棋子的攻击力提升 25%");
    }
    final(target) {
        new StrengthEffectTemplate().apply(target, 2, 2 * 2);
    }
};
StrengthPotionEnhancedActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], StrengthPotionEnhancedActionCard);
export { StrengthPotionEnhancedActionCard };
let StrengthPotionExtendedActionCard = class StrengthPotionExtendedActionCard extends SelectorActionCard {
    constructor() {
        super("力量药水（延长）", "strengthPotionExtended", "持续 5 回合 - 选中棋子的攻击力提升 15%");
    }
    final(target) {
        new StrengthEffectTemplate().apply(target, 1, 5 * 2);
    }
};
StrengthPotionExtendedActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], StrengthPotionExtendedActionCard);
export { StrengthPotionExtendedActionCard };
let SuperLaughingMovingStrategy = class SuperLaughingMovingStrategy extends PieceMovingStrategy {
    getPosition(piece) {
        return [];
    }
};
SuperLaughingMovingStrategy = __decorate([
    TypeRegistry.register()
], SuperLaughingMovingStrategy);
let SuperLaughingAttackingStrategy = class SuperLaughingAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece) {
        return [];
    }
};
SuperLaughingAttackingStrategy = __decorate([
    TypeRegistry.register()
], SuperLaughingAttackingStrategy);
let SuperLaughingActionCard = class SuperLaughingActionCard extends SelectorActionCard {
    constructor() {
        super("忍俊不禁", "superLaughing", "持续 2 回合 - 棋子不能主动移动和攻击。");
    }
    final(piece) {
        let movingModifier = new AttributeModifier(new SuperLaughingMovingStrategy(), 2 * 2);
        let attackingModifier = new AttributeModifier(new SuperLaughingAttackingStrategy(), 2 * 2);
        let effect = new StatusEffect("忍俊不禁", "superLaughing", "棋子不能主动移动和攻击。", [
            movingModifier,
            attackingModifier,
        ]).setAsNegative();
        piece.pushEffects(effect);
        piece.movingDestinationsCallbackProvider.area(0).modify(movingModifier);
        piece.attackingTargetsCallback.area(0).modify(attackingModifier);
    }
};
SuperLaughingActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], SuperLaughingActionCard);
export { SuperLaughingActionCard };
let WithBellAndTripodActionCard = class WithBellAndTripodActionCard extends SelectorActionCard {
    constructor() {
        super("戴钟之鼎", "withBellAndTripod", "持续 3 回合 - 选中棋子重量提升 6000%。");
    }
    final(piece) {
        let modifier = new AttributeModifier(60, 3 * 2);
        let effect = new StatusEffect("戴钟之鼎", "withBellAndTripod", "重量提升 6000%。", [
            modifier,
        ]);
        piece.weight.area(1).modify(modifier);
        piece.pushEffects(effect);
    }
};
WithBellAndTripodActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], WithBellAndTripodActionCard);
export { WithBellAndTripodActionCard };
let DeterminedResistanceActionCard = class DeterminedResistanceActionCard extends SelectorActionCard {
    constructor() {
        super("决意流搏", "determinedResistance", "持续 3 回合 - 选中棋子暴击率提升 12%。");
    }
    final(piece) {
        let modifier = new AttributeModifier(0.12, 3 * 2);
        let effect = new StatusEffect("决意流搏", "determinedResistance", "暴击率提升 12%。", [
            modifier,
        ]);
        piece.criticalRate.area(0).modify(modifier);
        piece.pushEffects(effect);
    }
};
DeterminedResistanceActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], DeterminedResistanceActionCard);
export { DeterminedResistanceActionCard };
const areaGunAttackActionCallback = registerAnonymous((thisPiece, targetCenter) => {
    const applyDamageToEnemyOnly = (damageObject) => {
        if (damageObject.target.team === damageObject.source?.team)
            return false;
        else {
            damageObject.apply();
            return true;
        }
    };
    const spreadDamageScale = 0.4;
    const spreadDamageType = DamageType.Ranged;
    let centerPosition = targetCenter.position;
    let nearbyPositions = [
        centerPosition.add(new Vector2(0, 1)),
        centerPosition.add(new Vector2(0, -1)),
        centerPosition.add(new Vector2(1, 0)),
        centerPosition.add(new Vector2(-1, 0)),
    ];
    let targets = nearbyPositions
        .map((pos) => {
        return pos.owner;
    })
        .filter((piece) => piece != null);
    let centerDamageObject = thisPiece.SimulateAttack(targetCenter);
    // 模拟一个与中心棋子重合的虚拟棋子，直接使用中心棋子作为攻击源会识别成攻击队友
    let explosionCenter = Piece.virtualPiece(centerPosition);
    explosionCenter.team = thisPiece.team; // 正确标识队伍，而不是None
    let spreadDamageObjects = targets.map((target) => {
        let object = thisPiece.SimulateAttack(target);
        object.amount *= spreadDamageScale;
        object.type = spreadDamageType;
        object.source = explosionCenter;
        return object;
    });
    // 先攻击外围，为击退腾出空间
    spreadDamageObjects.forEach(applyDamageToEnemyOnly);
    return applyDamageToEnemyOnly(centerDamageObject);
}, "areaGunAttackActionCallback");
let AreaGunActionStrategy = class AreaGunActionStrategy extends PieceActionStrategy {
    attack(a, b) {
        return areaGunAttackActionCallback(a, b);
    }
};
AreaGunActionStrategy = __decorate([
    TypeRegistry.register()
], AreaGunActionStrategy);
let AreaGunActionCardEndTrigger = class AreaGunActionCardEndTrigger extends DamageTrigger {
    piece;
    effect;
    constructor(piece, effect) {
        super();
        this.piece = piece;
        this.effect = effect;
    }
    action(damage) {
        if (damage.source === this.piece) {
            this.effect.disable(); // 禁用效果
        }
    }
};
AreaGunActionCardEndTrigger = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [Object, StatusEffect])
], AreaGunActionCardEndTrigger);
let AreaGunActionCard = class AreaGunActionCard extends SelectorActionCard {
    constructor() {
        super("威震四方", "areaGun", "一次性 - 选中的「炮」下次攻击造成范围伤害。");
    }
    final(piece) {
        let modifier = new AttributeModifier(new AreaGunActionStrategy());
        piece.attackActionCallbackProvider.area(0).modify(modifier);
        let effect = new StatusEffect("威震四方", "areaGun", "下一次攻击造成范围伤害", [modifier]);
        piece.pushEffects(effect);
        // 添加触发器，在主动攻击后移除效果，达到一次性使用。
        TriggerManager.addTrigger(new AreaGunActionCardEndTrigger(piece, effect));
    }
};
AreaGunActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], AreaGunActionCard);
export { AreaGunActionCard };
//# sourceMappingURL=actionCard.js.map