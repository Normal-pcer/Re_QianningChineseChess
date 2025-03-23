import { AttributeModifier } from "./attributeProvider.js";
import { registerAnonymous, registerCallback } from "./callbackRegister.js";
import { returnCardById } from "./cardLooting.js";
import { ray } from "./defaultMovingBehaviors.js";
import { StatusEffect } from "./effect.js";
import { StrengthEffectTemplate } from "./effectTemplate.js";
import { Piece, PieceType } from "./piece.js";
import { PieceAttackingStrategy } from "./pieceStrategy.js";
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
    constructor(name: string, id: string, description: string, pieceType: string) {
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
        super(
            "力量药水",
            "streangthPotion",
            "持续 3 回合-选中棋子的攻击力提升 15%",
            PieceType.None
        );
    }

    final(target: Piece): void {
        let factory = new StrengthEffectTemplate();
        factory.apply(target, 1, 3 * 2);
    }
}


class HighGunAttackingStrategy implements PieceAttackingStrategy {
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
        super("高射炮", "highGun", "下一次攻击允许间隔至多两个棋子", PieceType.None);
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
