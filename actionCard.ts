import { AttributeModifier } from "./attributeProvider.js";
import { registerAnonymous, registerCallback } from "./callbackRegister.js";
import { returnCardById } from "./cardLooting.js";
import { Damage } from "./damage.js";
import { DamageType } from "./damageType.js";
import { filterGrids, ray } from "./defaultMovingBehaviors.js";
import { StatusEffect } from "./effect.js";
import {
    PotionEffectTemplate,
    RegenerationEffectTemplate,
    StrengthEffectTemplate,
    WeaknessEffectTemplate,
} from "./effectTemplate.js";
import { Piece, PieceType } from "./piece.js";
import { PieceActionStrategy, PieceAttackingStrategy, PieceMovingStrategy } from "./pieceStrategy.js";
import { Position } from "./position.js";
import {
    getCurrentSelection,
    ItemType,
    SelectionManager,
    setCurrentSelection,
    SingleSelection,
} from "./selection.js";
import { Serializable, TypeRegistry } from "./serialize.js";
import { TriggerManager, DamageTrigger } from "./trigger.js";
import { Vector2 } from "./vector.js";

/**
 * 行为卡。
 * 在使用时调用 onApply() 方法。
 */
export abstract class ActionCard extends Serializable {
    readonly name: string;
    readonly id: string;
    readonly description: string;
    private enabled: boolean = true;

    abstract onApply(): void;
    constructor(name: string, id: string, description: string) {
        super();
        this.name = name;
        this.id = id;
        this.description = description;
    }

    apply() {
        this.onApply();
    }
}

export class TestActionCard extends ActionCard {
    constructor() {
        super("测试卡牌", "test", "这是一个测试卡牌");
    }
    onApply(): void {
        console.log("使用测试卡牌");
    }
}

/**
 * 进行一次单选棋子，然后进行接下来的操作。
 * pieceType 成员指定棋子类型，null 表示没有限制
 */
export abstract class SelectorActionCard extends ActionCard {
    readonly pieceType: string;
    constructor(name: string, id: string, description: string, pieceType: string = PieceType.None) {
        super(name, id, description);
        this.pieceType = pieceType;
    }

    onApply(): void {
        // 进行一次选择
        let currentSelection = getCurrentSelection();
        // 新的选择
        let targetSelection = new SelectionManager(
            new SingleSelection(
                [],
                ItemType.Piece,
                `请选择要应用「${this.name}」的棋子`,
                (item) => {
                    if (item.data instanceof Piece) {
                        return (
                            item.data.type === this.pieceType || this.pieceType === PieceType.None
                        );
                    }
                    return false;
                }
            )
        )
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

    abstract final(target: Piece): void;
}

export class StrengthPotionActionCard extends SelectorActionCard {
    constructor() {
        super("力量药水", "streangthPotion", "持续 3 回合-选中棋子的攻击力提升 15%");
    }

    final(target: Piece): void {
        let factory = new StrengthEffectTemplate();
        factory.apply(target, 1, 3 * 2);
    }
}

@TypeRegistry.register()
class HighGunAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece: Piece): Position[] {
        return ray(piece.position, new Vector2(1, 0), 2, 1).concat(
            ray(piece.position, new Vector2(-1, 0), 2, 1),
            ray(piece.position, new Vector2(0, 1), 2, 1),
            ray(piece.position, new Vector2(0, -1), 2, 1)
        );
    }
}

/**
 * 高射炮。
 */
@TypeRegistry.register()
export class HighGunActionCard extends SelectorActionCard {
    constructor() {
        super("高射炮", "highGun", "下一次攻击允许间隔至多两个棋子", PieceType.Gun);
    }

    final(piece: Piece): void {
        let modifier = new AttributeModifier(new HighGunAttackingStrategy());
        piece.attackingTargetsCallback.area(0).modify(modifier);

        let effect = new StatusEffect("高射炮", "highGun", "下一次攻击允许间隔至多两个棋子", [
            modifier,
        ]);
        piece.pushEffects(effect);

        let pieceElement = piece.htmlElement;
        TriggerManager.addTrigger(
            new DamageTrigger((damage) => {
                if (damage.source?.htmlElement === pieceElement && pieceElement !== null) {
                    effect.disable();
                }
            })
        );
    }
}

/**
 * “一马平川”状态下的马的移动、攻击策略
 */
@TypeRegistry.register()
class LimitlessHorseMovingStrategy extends PieceMovingStrategy {
    getPosition(piece: Piece): Position[] {
        return filterGrids(
            (pos) =>
                piece.position.manhattanDistance(pos) == 3 &&
                piece.position.chebyshevDistance(pos) == 2
        );
    }
}
@TypeRegistry.register()
class LimitlessHorseAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece: Piece): Position[] {
        return filterGrids(
            (pos) =>
                piece.position.manhattanDistance(pos) == 3 &&
                piece.position.chebyshevDistance(pos) == 2
        );
    }
}

@TypeRegistry.register()
export class LimitlessHorseActionCard extends SelectorActionCard {
    constructor() {
        super(
            "一马平川",
            "limitlessHorse",
            "持续 3 回合 - 马的行动不再受「蹩马腿」限制",
            PieceType.Horse
        );
    }

    final(target: Piece): void {
        let attackingModifier = new AttributeModifier(new LimitlessHorseAttackingStrategy(), 3 * 2);
        let movingModifier = new AttributeModifier(new LimitlessHorseMovingStrategy(), 3 * 2);
        let effect = new StatusEffect(
            "一马平川",
            "limitlessHorse",
            "马的行动不再受「蹩马腿」限制",
            [attackingModifier, movingModifier]
        );

        target.pushEffects(effect);
        target.attackingTargetsCallback.area(0).modify(attackingModifier);
        target.movingDestinationsCallbackProvider.area(0).modify(movingModifier);
    }
}

@TypeRegistry.register()
export class WeaknessPotionActionCard extends SelectorActionCard {
    constructor() {
        super("虚弱药水", "weaknessPotion", "持续 3 回合 - 选中棋子的攻击力降低 20%");
    }

    final(target: Piece): void {
        new WeaknessEffectTemplate().apply(target, 1);
    }
}

@TypeRegistry.register()
export class InstantHealthPotionActionCard extends SelectorActionCard {
    constructor() {
        super("治疗药水", "instantHealthPotion", "选中棋子回复 600 点生命值");
    }
    final(target: Piece): void {
        target.health = Math.min(target.health + 600, target.maxHealth.result);
        target.draw(); // 直接重绘棋子
    }
}

@TypeRegistry.register()
export class RegenerationPotionActionCard extends SelectorActionCard {
    constructor() {
        super("再生药水", "regenerationPotion", "持续 3 回合 - 选中棋子每回合回复 6% 生命值");
    }
    final(target: Piece): void {
        new RegenerationEffectTemplate().apply(target, 1, 3 * 2);
    }
}

@TypeRegistry.register()
export class PotionPotionActionCard extends SelectorActionCard {
    constructor() {
        super(
            "剧毒药水",
            "potionPotion",
            "持续 3 回合 - 每轮造成 3% 生命值上限 + 40 的魔法伤害。至多使生命值降低到 5%。"
        );
    }
    final(target: Piece): void {
        new PotionEffectTemplate().apply(target, 1, 3 * 2);
    }
}

@TypeRegistry.register()
export class PotionPotionEnhancedActionCard extends SelectorActionCard {
    constructor() {
        super(
            "剧毒药水（加强）",
            "potionPotionEnhanced",
            "持续 2 回合 - 每轮造成 5% 生命值上限 + 80 的魔法伤害。至多使生命值降低到 5%。"
        );
    }
    final(target: Piece): void {
        new PotionEffectTemplate().apply(target, 2, 2 * 2);
    }
}

@TypeRegistry.register()
export class StrengthPotionEnhancedActionCard extends SelectorActionCard {
    constructor() {
        super(
            "力量药水（加强）",
            "strengthPotionEnhanced",
            "持续 2 回合 - 选中棋子的攻击力提升 25%"
        );
    }
    final(target: Piece): void {
        new StrengthEffectTemplate().apply(target, 2, 2 * 2);
    }
}

@TypeRegistry.register()
export class StrengthPotionExtendedActionCard extends SelectorActionCard {
    constructor() {
        super(
            "力量药水（延长）",
            "strengthPotionExtended",
            "持续 5 回合 - 选中棋子的攻击力提升 15%"
        );
    }
    final(target: Piece): void {
        new StrengthEffectTemplate().apply(target, 1, 5 * 2);
    }
}

@TypeRegistry.register()
class SuperLaughingMovingStrategy extends PieceMovingStrategy {
    getPosition(piece: Piece): Position[] {
        return [];
    }
}
@TypeRegistry.register()
class SuperLaughingAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece: Piece): Position[] {
        return [];
    }
}

export class SuperLaughingActionCard extends SelectorActionCard {
    constructor() {
        super("忍俊不禁", "superLaughing", "持续 2 回合 - 棋子不能主动移动和攻击。");
    }
    final(piece: Piece): void {
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
}

export class WithBellAndTripodActionCard extends SelectorActionCard {
    constructor() {
        super("戴钟之鼎", "withBellAndTripod", "持续 3 回合 - 选中棋子重量提升 6000%。");
    }
    final(piece: Piece): void {
        let modifier = new AttributeModifier(60, 3 * 2);
        let effect = new StatusEffect(
            "戴钟之鼎",
            "withBellAndTripod",
            "重量提升 6000%。",
            [modifier]
        );
        piece.weight.area(1).modify(modifier);
        piece.pushEffects(effect);
    }
}

export class DeterminedResistanceActionCard extends SelectorActionCard {
    constructor() {
        super("决意流搏", "determinedResistance", "持续 3 回合 - 选中棋子暴击率提升 12%。")
    }
    final(piece: Piece): void {
        let modifier = new AttributeModifier(0.12, 3 * 2);
        let effect = new StatusEffect(
            "决意流搏",
            "determinedResistance",
            "暴击率提升 12%。",
            [modifier]
        );
        piece.criticalRate.area(0).modify(modifier);
        piece.pushEffects(effect);
    }
}

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

@TypeRegistry.register()
class AreaGunActionStrategy extends PieceActionStrategy {
    attack(a: Piece, b: Piece): boolean {
        return areaGunAttackActionCallback(a, b);
    }
}

export class AreaGunActionCard extends SelectorActionCard {
    constructor() {
        super("威震四方", "areaGun", "一次性 - 选中的「炮」下次攻击造成范围伤害。");
    }
    final(piece: Piece): void {
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
}