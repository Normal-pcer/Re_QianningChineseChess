import { AttributeModifier } from "./attributeProvider.js";
import { registerAnonymous, registerCallback } from "./callbackRegister.js";
import { returnCardById } from "./cardLooting.js";
import { Damage } from "./damage.js";
import { DamageType } from "./damageType.js";
import { filterGrids, ray } from "./defaultMovingBehaviors.js";
import { StatusEffect } from "./effect.js";
import { StrengthEffectTemplate, WeaknessEffectTemplate, RegenerationEffectTemplate, PotionEffectTemplate } from "./effectTemplate.js";
import { Piece, pieces, PieceType } from "./piece.js";
import { PieceActionStrategy, PieceAttackingStrategy, PieceMovingStrategy } from "./pieceStrategy.js";
import { Position } from "./position.js";
import {
    getCurrentSelection,
    ItemType,
    SelectionManager,
    setCurrentSelection,
    SingleSelection,
} from "./selection.js";
import { DamageTrigger, TriggerManager } from "./trigger.js";
import { Vector2 } from "./vector.js";

export class ActionCard {
    name: string;
    id: string;
    description: string;
    applyCallback: () => void; // 在使用卡牌时调用
    enabled: boolean = true;

    constructor(name: string, id: string, description: string, applyCallback: () => void) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.applyCallback = registerAnonymous(
            applyCallback,
            "actionCard'" + id + "'applyCallback"
        );
    }

    apply() {
        console.log(`使用卡牌:`, this);
        return this.applyCallback();
    }
}

export const testActionCard = new ActionCard(
    "测试",
    "test",
    "测试用;可以提升全部棋子的攻击力,持续3回合",
    () => {
        pieces.forEach((piece) => {
            piece.attackDamage.multiplicationAreas[1].modify(new AttributeModifier(2, 3 * 2));
        });
    }
);

/**
 * 进行一次单选棋子，然后基于选择的棋子进行接下来的操作
 * @pieceType 指定棋子类型，None表示不限制
 */
const singleTargetSelectorTemplate = (
    name: string,
    id: string,
    description: string,
    pieceType: string,
    final: (result: Piece) => void
) => {
    let callback = () => {
        let currentSelection = getCurrentSelection();
        let targetSelection = new SelectionManager(
            new SingleSelection([], ItemType.Piece, `请选择要应用「${name}」的棋子`, (item) => {
                return (item.data as Piece).type === pieceType || pieceType === PieceType.None;
            })
        )
            .once()
            .oncancel((result) => {
                returnCardById(id);
            })
            .replaceWithFinally(currentSelection)
            .final((result) => {
                final(result[0].data as Piece);
            });

        setCurrentSelection(targetSelection);
    };
    return new ActionCard(name, id, description, callback);
};

const highGunAttackCallback = registerAnonymous((piece_: Piece) => {
    return ray(piece_.position, new Vector2(1, 0), 2, 1).concat(
        ray(piece_.position, new Vector2(-1, 0), 2, 1),
        ray(piece_.position, new Vector2(0, 1), 2, 1),
        ray(piece_.position, new Vector2(0, -1), 2, 1)
    );
}, "highGunAttackCallback");

class HighGunAttackingStrategy implements PieceAttackingStrategy {
    getPosition(piece: Piece): Position[] {
        return ray(piece.position, new Vector2(1, 0), 2, 1).concat(
            ray(piece.position, new Vector2(-1, 0), 2, 1),
            ray(piece.position, new Vector2(0, 1), 2, 1),
            ray(piece.position, new Vector2(0, -1), 2, 1)
        );
    }
}

export const highGunActionCard = singleTargetSelectorTemplate(
    "高射炮",
    "highGun",
    "一次性-允许炮至多隔两个棋子攻击",
    PieceType.Gun,
    (piece) => {
        let modifier = new AttributeModifier(new HighGunAttackingStrategy());
        piece.attackingTargetsCallback.area(0).modify(modifier);
        let effect = new StatusEffect("高射炮", "highGun", "下一次攻击允许隔至多两个棋子", [
            modifier,
        ]);
        piece.pushEffects(effect);
        let pieceElement = piece.htmlElement;

        // 添加触发器，当棋子主动攻击时移除效果。
        TriggerManager.addTrigger(
            new DamageTrigger((damage) => {
                if (damage.source?.htmlElement === pieceElement && pieceElement != null) {
                    effect.disable();
                }
            })
        );
    }
);

/**
 * “一马平川”状态下的马的移动、攻击策略
 */
class LimitlessHorseMovingStrategy implements PieceMovingStrategy {
    getPosition(piece: Piece): Position[] {
        return filterGrids(
            (pos) =>
                piece.position.manhattanDistance(pos) == 3 &&
                piece.position.chebyshevDistance(pos) == 2
        );
    }
}
class LimitlessHorseAttackingStrategy implements PieceAttackingStrategy {
    getPosition(piece: Piece): Position[] {
        return filterGrids(
            (pos) =>
                piece.position.manhattanDistance(pos) == 3 &&
                piece.position.chebyshevDistance(pos) == 2
        )
    }
}

export const limitlessHorseActionCard = singleTargetSelectorTemplate(
    "一马平川",
    "limitlessHorse",
    "持续3回合-马的行动不再受「蹩马腿」限制",
    PieceType.Horse,
    (result) => {
        let piece = result;
        let attacking_modifier = new AttributeModifier(new LimitlessHorseAttackingStrategy(), 3 * 2);
        let moving_modifier = new AttributeModifier(new LimitlessHorseMovingStrategy(), 3 * 2);
        let effect = new StatusEffect(
            "一马平川",
            "limitlessHorse",
            "马的行动不再受「蹩马腿」限制",
            [attacking_modifier, moving_modifier]
        );
        piece.pushEffects(effect);
        piece.attackingTargetsCallback.area(0).modify(attacking_modifier);
        piece.movingDestinationsCallbackProvider.area(0).modify(moving_modifier);
    }
);

export const strengthPotionActionCard = singleTargetSelectorTemplate(
    "力量药水",
    "strengthPotion",
    "持续3回合-选中棋子的攻击力提升15%",
    PieceType.None,
    (result) => {
        StrengthEffectTemplate.apply(result, 1, 3 * 2);
    }
);

export const weaknessPotionActionCard = singleTargetSelectorTemplate(
    "虚弱药水",
    "weaknessPotion",
    "持续3回合-选中棋子的攻击力降低20%",
    PieceType.None,
    (result) => {
        WeaknessEffectTemplate.apply(result, 1, 3 * 2);
    }
);

export const healthInstantPotionActionCard = singleTargetSelectorTemplate(
    "治疗药水",
    "healthInstantPotion",
    "选中棋子回复600点生命值",
    PieceType.None,
    (result) => {
        let piece = result;
        piece.health = Math.min(piece.health + 600, piece.maxHealth.result);
        piece.draw();
    }
);

export const regenerationPotionActionCard = singleTargetSelectorTemplate(
    "再生药水",
    "regenerationPotion",
    "持续3回合-选中棋子每回合回复6%生命值",
    PieceType.None,
    (result) => {
        RegenerationEffectTemplate.apply(result, 1, 3 * 2);
    }
);

export const potionPotionActionCard = singleTargetSelectorTemplate(
    "剧毒药水",
    "potionPotion",
    "持续3回合-选中棋子每轮受到3%+40魔法伤害",
    PieceType.None,
    (result) => {
        PotionEffectTemplate.apply(result, 1, 3 * 2);
    }
);
export const potionPotionEnhancedActionCard = singleTargetSelectorTemplate(
    "剧毒药水（加强）",
    "potionPotionEnhanced",
    "持续3回合-选中棋子每轮受到5%+80魔法伤害",
    PieceType.None,
    (result) => {
        PotionEffectTemplate.apply(result, 2, 2 * 2);
    }
);


export const strengthPotionEnhancedActionCard = singleTargetSelectorTemplate(
    "力量药水（加强）",
    "strengthPotionEnhanced",
    "持续2回合-选中棋子的攻击力提升25%",
    PieceType.None,
    (result) => {
        StrengthEffectTemplate.apply(result, 2, 2 * 2);
    }
);

export const strengthPotionExtendedActionCard = singleTargetSelectorTemplate(
    "力量药水（延长）",
    "strengthPotionExtended",
    "持续5回合-选中棋子的攻击力提升15%",
    PieceType.None,
    (result) => {
        StrengthEffectTemplate.apply(result, 1, 5 * 2);
    }
);

class SuperLaughingMovingStrategy implements PieceMovingStrategy {
    getPosition(piece: Piece): Position[] {
        return [];
    }
}

class SuperLaughingAttackingStrategy implements PieceAttackingStrategy {
    getPosition(piece: Piece): Position[] {
        return [];
    }
}

export const superLaughingActionCard = singleTargetSelectorTemplate(
    "忍俊不禁",
    "superLaughing",
    "持续2回合-选中棋子不能移动",
    PieceType.None,
    (result) => {
        let piece = result;
        let moving_modifier = new AttributeModifier(new SuperLaughingMovingStrategy, 2 * 2);
        let attacking_modifier = new AttributeModifier(new SuperLaughingAttackingStrategy(), 2 * 2);
        let effect = new StatusEffect("忍俊不禁", "superLaughing", "不能主动移动和攻击", [
            moving_modifier, attacking_modifier
        ]).setAsNegative();
        piece.pushEffects(effect);
        piece.movingDestinationsCallbackProvider.area(0).modify(moving_modifier);
        piece.attackingTargetsCallback.area(0).modify(attacking_modifier);
    }
);

export const withBellAndTripodActionCard = singleTargetSelectorTemplate(
    "戴钟之鼎",
    "withBellAndTripod",
    "持续3回合-选中棋子重量提升6000%",
    PieceType.None,
    (result) => {
        let piece = result;
        let modifier = new AttributeModifier(60, 3 * 2);
        let effect = new StatusEffect("戴钟之鼎", "withBellAndTripod", "重量提升6000%", [modifier]);
        piece.weight.area(1).modify(modifier);
        piece.pushEffects(effect);
    }
);

export const determinedResistanceActionCard = singleTargetSelectorTemplate(
    "决意流搏",
    "determinedResistance",
    "持续3回合-选中棋子的暴击率提升12%",
    PieceType.None,
    (result) => {
        let piece = result;
        let modifier = new AttributeModifier(0.12, 3 * 2);
        let effect = new StatusEffect("决意流博", "determinedResistance", "暴击率提升12%", [
            modifier,
        ]);
        piece.criticalRate.area(0).modify(modifier);
        piece.pushEffects(effect);
    }
);

const areaGunAttackActionCallback = registerAnonymous((thisPiece: Piece, targetCenter: Piece) => {
    const applyDamageToEnemyOnly = (damageObject: Damage) => {
        if (damageObject.target.team === damageObject.source?.team) return false;
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

class AreaGunActionStrategy implements PieceActionStrategy {
    attack(a: Piece, b: Piece): boolean {
        return areaGunAttackActionCallback(a, b);
    }
}

export const areaGunActionCard = singleTargetSelectorTemplate(
    "威震四方",
    "areaGun",
    "一次性-选中的「炮」会造成范围伤害",
    PieceType.Gun,
    (result) => {
        let piece = result;
        let modifier = new AttributeModifier(new AreaGunActionStrategy());
        piece.attackActionCallbackProvider.area(0).modify(modifier);
        let effect = new StatusEffect("威震四方", "areaGun", "下一次攻击造成范围伤害", [modifier]);
        piece.pushEffects(effect);

        // 添加触发器，在主动攻击后移除效果，达到一次性使用。
        TriggerManager.addTrigger(
            new DamageTrigger((damage) => {
                if (damage.source === piece) {
                    effect.disable();  // 禁用效果
                }
            })
        );
    }
);

