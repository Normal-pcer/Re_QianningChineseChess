import { AttributeModifier } from "./attributeProvider.js";
import { registerAnonymous } from "./callbackRegister.js";
import { returnCardById } from "./cardLooting.js";
import { DamageType } from "./damageType.js";
import { filterGrids, ray } from "./defaultMovingBehaviors.js";
import { StatusEffect } from "./effect.js";
import { StrengthEffectTemplate, WeaknessEffectTemplate } from "./effectTemplate.js";
import { Piece, pieces, PieceType } from "./piece.js";
import { getCurrentSelection, ItemType, SelectionManager, setCurrentSelection, SingleSelection, } from "./selection.js";
import { DamageTrigger, TriggerManager } from "./trigger.js";
import { Vector2 } from "./vector.js";
export class ActionCard {
    name;
    id;
    description;
    applyCallback; // 在使用卡牌时调用
    enabled = true;
    constructor(name, id, description, applyCallback) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.applyCallback = registerAnonymous(applyCallback, "actionCard'" + id + "'applyCallback");
    }
    apply() {
        console.log(`使用卡牌:`, this);
        return this.applyCallback();
    }
}
export const testActionCard = new ActionCard("测试", "test", "测试用;可以提升全部棋子的攻击力,持续3回合", () => {
    pieces.forEach((piece) => {
        piece.attackDamage.multiplicationAreas[1].modify(new AttributeModifier(2, 3 * 2));
    });
});
/**
 * 进行一次单选棋子，然后基于选择的棋子进行接下来的操作
 * @pieceType 指定棋子类型，None表示不限制
 */
const singleTargetSelectorTemplate = (name, id, description, pieceType, final) => {
    let callback = () => {
        let currentSelection = getCurrentSelection();
        let targetSelection = new SelectionManager(new SingleSelection([], ItemType.Piece, `请选择要应用「${name}」的棋子`, (item) => {
            return item.data.type === pieceType || pieceType === PieceType.None;
        }))
            .once()
            .oncancel((result) => {
            returnCardById(id);
        })
            .replaceWithFinally(currentSelection)
            .final((result) => {
            final(result[0].data);
        });
        setCurrentSelection(targetSelection);
    };
    return new ActionCard(name, id, description, callback);
};
const highGunAttackCallback = registerAnonymous((piece_) => {
    return ray(piece_.position, new Vector2(1, 0), 2, 1).concat(ray(piece_.position, new Vector2(-1, 0), 2, 1), ray(piece_.position, new Vector2(0, 1), 2, 1), ray(piece_.position, new Vector2(0, -1), 2, 1));
}, "highGunAttackCallback");
export const highGunActionCard = singleTargetSelectorTemplate("高射炮", "highGun", "一次性-允许炮至多隔两个棋子攻击", PieceType.Gun, (piece) => {
    let modifier = new AttributeModifier(highGunAttackCallback);
    piece.attackingTargetsCallback.area(0).modify(modifier);
    let effect = new StatusEffect("高射炮", "highGun", "下一次攻击允许隔至多两个棋子", [
        modifier,
    ]);
    piece.pushEffects(effect);
    let pieceElement = piece.htmlElement;
    // 添加触发器，当棋子主动攻击时移除效果。
    TriggerManager.addTrigger(new DamageTrigger((damage) => {
        if (damage.source?.htmlElement === pieceElement && pieceElement != null) {
            effect.enabled = false;
        }
    }));
});
const limitlessHorseAttackCallback = registerAnonymous((piece) => {
    return filterGrids((pos) => piece.position.manhattanDistance(pos) == 3 && piece.position.chebyshevDistance(pos) == 2);
}, "limitlessHorseAttackCallback");
export const limitlessHorseActionCard = singleTargetSelectorTemplate("一马平川", "limitlessHorse", "持续3回合-马的行动不再受「蹩马腿」限制", PieceType.Horse, (result) => {
    let piece = result;
    let modifier = new AttributeModifier(limitlessHorseAttackCallback, 3 * 2);
    let effect = new StatusEffect("一马平川", "limitlessHorse", "马的行动不再受「蹩马腿」限制", [modifier]);
    piece.pushEffects(effect);
    piece.attackingTargetsCallback.area(0).modify(modifier);
    piece.movingDestinationsCallbackProvider.area(0).modify(modifier);
});
export const strengthPotionActionCard = singleTargetSelectorTemplate("力量药水", "strengthPotion", "持续3回合-选中棋子的攻击力提升15%", PieceType.None, (result) => {
    StrengthEffectTemplate.apply(result, 1, 3 * 2);
});
export const weaknessPotionActionCard = singleTargetSelectorTemplate("虚弱药水", "weaknessPotion", "持续3回合-选中棋子的攻击力降低20%", PieceType.None, (result) => {
    WeaknessEffectTemplate.apply(result, 1, 3 * 2);
});
export const healthInstantPotionActionCard = singleTargetSelectorTemplate("治疗药水", "healthInstantPotion", "选中棋子回复600点生命值", PieceType.None, (result) => {
    let piece = result;
    piece.health = Math.min(piece.health + 600, piece.maxHealth.result);
    piece.draw();
});
export const strengthPotionEnhancedActionCard = singleTargetSelectorTemplate("力量药水（加强）", "strengthPotionEnhanced", "持续2回合-选中棋子的攻击力提升25%", PieceType.None, (result) => {
    StrengthEffectTemplate.apply(result, 2, 2 * 2);
});
export const strengthPotionExtendedActionCard = singleTargetSelectorTemplate("力量药水（延长）", "strengthPotionExtended", "持续5回合-选中棋子的攻击力提升15%", PieceType.None, (result) => {
    StrengthEffectTemplate.apply(result, 1, 5 * 2);
});
export const superLaughingActionCard = singleTargetSelectorTemplate("忍俊不禁", "superLaughing", "持续3回合-选中棋子不能移动", PieceType.None, (result) => {
    let piece = result;
    let modifier = new AttributeModifier((piece_) => {
        return filterGrids((pos) => false);
    }, 3 * 2);
    let effect = new StatusEffect("忍俊不禁", "superLaughing", "不能主动移动和攻击", [
        modifier,
    ]).setAsNegative();
    piece.pushEffects(effect);
    piece.movingDestinationsCallbackProvider.area(0).modify(modifier);
    piece.attackingTargetsCallback.area(0).modify(modifier);
});
export const withBellAndTripodActionCard = singleTargetSelectorTemplate("戴钟之鼎", "withBellAndTripod", "持续3回合-选中棋子重量提升6000%", PieceType.None, (result) => {
    let piece = result;
    let modifier = new AttributeModifier(60, 3 * 2);
    let effect = new StatusEffect("戴钟之鼎", "withBellAndTripod", "重量提升6000%", [modifier]);
    piece.weight.area(1).modify(modifier);
    piece.pushEffects(effect);
});
export const determinedResistanceActionCard = singleTargetSelectorTemplate("决意流搏", "determinedResistance", "持续3回合-选中棋子的暴击率提升12%", PieceType.None, (result) => {
    let piece = result;
    let modifier = new AttributeModifier(0.12, 3 * 2);
    let effect = new StatusEffect("决意流博", "determinedResistance", "暴击率提升12%", [
        modifier,
    ]);
    piece.criticalRate.area(0).modify(modifier);
    piece.pushEffects(effect);
});
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
export const areaGunActionCard = singleTargetSelectorTemplate("威震四方", "areaGun", "一次性-选中的「炮」造成会造成范围伤害", PieceType.Gun, (result) => {
    let piece = result;
    let modifier = new AttributeModifier(areaGunAttackActionCallback);
    piece.attackActionCallbackProvider.area(0).modify(modifier);
    let effect = new StatusEffect("威震四方", "areaGun", "下一次攻击造成范围伤害", [modifier]);
    piece.pushEffects(effect);
    // 添加触发器，在主动攻击后移除效果，达到一次性使用。
    TriggerManager.addTrigger(new DamageTrigger((damage) => {
        if (damage.source === piece) {
            effect.enabled = false;
        }
    }));
});
//# sourceMappingURL=actionCard.js.map