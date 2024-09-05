import { AttributeModifier } from "./attributeProvider.js";
import { registerAnonymous, registerCallback } from "./callbackRegister.js";
import { filterGrids, ray } from "./defaultMovingBehaviors.js";
import { Piece, pieces, PieceType } from "./piece.js";
import {
    getCurrentSelection,
    ItemType,
    SelectedItem,
    SelectionManager,
    setCurrentSelection,
    SingleSelection,
} from "./selection.js";
import { DamageTrigger, Trigger, TriggerManager } from "./trigger.js";
import { Vector2 } from "./vector.js";

export class ActionCard {
    name: string;
    id: string;
    description: string;
    applyCallback: () => void; // 在使用卡牌时调用

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
    pieceType: string,
    final: (results: SelectedItem[]) => void
) => {
    let callback = () => {
        let currentSelection = getCurrentSelection();
        let targetSelection = new SelectionManager(
            new SingleSelection([], ItemType.Piece, `请选择要应用「${name}」的棋子`, (item) => {
                return (item.data as Piece).type === pieceType || pieceType === PieceType.None;
            })
        ).final((results) => {
            final(results);
            setCurrentSelection(currentSelection);
        });

        setCurrentSelection(targetSelection);
    };
    return callback;
};

export const highGunActionCard = new ActionCard(
    "高射炮",
    "highGun",
    "一次性-允许炮至多隔两个棋子攻击",
    singleTargetSelectorTemplate("高射炮", PieceType.Gun, (results) => {
        let piece = results[0].data as Piece;
        let modifier = new AttributeModifier((piece_: Piece) => {
            return ray(piece_.position, new Vector2(1, 0), 2, 1).concat(
                ray(piece_.position, new Vector2(-1, 0), 2, 1),
                ray(piece_.position, new Vector2(0, 1), 2, 1),
                ray(piece_.position, new Vector2(0, -1), 2, 1)
            );
        });
        piece.attackingTargetsCallback.area(0).modify(modifier);
        TriggerManager.addTrigger(
            new DamageTrigger((damage) => {
                if (damage.source === piece) {
                    modifier.enabled = false; // 攻击一次就失效
                }
            })
        );
    })
);

export const limitlessHorseActionCard = new ActionCard(
    "一马平川",
    "limitlessHorse",
    "持续3回合-马的行动不再受「蹩马腿」限制",
    singleTargetSelectorTemplate("一马平川", PieceType.Horse, (results) => {
        let piece = results[0].data as Piece;
        let modifier = new AttributeModifier((piece2: Piece) => {
            return filterGrids(
                (pos) =>
                    piece.position.manhattanDistance(pos) == 3 &&
                    piece.position.chebyshevDistance(pos) == 2
            );
        }, 3 * 2);
        piece.attackingTargetsCallback.area(0).modify(modifier);
        piece.movingDestinationsCallback.area(0).modify(modifier);
    })
);

export const strengthPotionActionCard = new ActionCard(
    "力量药水",
    "strengthPotion",
    "持续3回合-选中棋子的攻击力提升15%",
    singleTargetSelectorTemplate("力量药水", PieceType.None, (results) => {
        let piece = results[0].data as Piece;
        let modifier = new AttributeModifier(0.15, 3 * 2);
        piece.attackDamage.area(1).modify(modifier);
        console.log(modifier);
    })
);

export const weaknessPotionActionCard = new ActionCard(
    "虚弱药水",
    "weaknessPotion",
    "持续3回合-选中棋子的攻击力降低20%",
    singleTargetSelectorTemplate("虚弱药水", PieceType.None, (results) => {
        let piece = results[0].data as Piece;
        let modifier = new AttributeModifier(-0.2, 3 * 2);
        piece.attackDamage.area(1).modify(modifier);
        console.log(modifier);
    })
);

export const healthInstantPotionActionCard = new ActionCard(
    "治疗药水",
    "healthInstantPotion",
    "选中棋子回复600点生命值",
    singleTargetSelectorTemplate("治疗药水", PieceType.None, (results) => {
        let piece = results[0].data as Piece;
        piece.health = Math.min(piece.health + 600, piece.maxHealth.result);
        piece.draw();
    })
);

export const strengthPotionEnhancedActionCard = new ActionCard(
    "力量药水（加强）",
    "strengthPotionEnhanced",
    "持续2回合-选中棋子的攻击力提升25%",
    singleTargetSelectorTemplate("力量药水（加强）", PieceType.None, (results) => {
        let piece = results[0].data as Piece;
        let modifier = new AttributeModifier(0.25, 1);
        piece.attackDamage.area(1).modify(modifier);
        console.log(modifier);
    })
);

export const strengthPotionExtendedActionCard = new ActionCard(
    "力量药水（延长）",
    "strengthPotionExtended",
    "持续5回合-选中棋子的攻击力提升15%",
    singleTargetSelectorTemplate("力量药水（延长）", PieceType.None, (results) => {
        let piece = results[0].data as Piece;
        let modifier = new AttributeModifier(0.15, 5 * 2);
        piece.attackDamage.area(1).modify(modifier);
        console.log(modifier);
    })
);

export const superLaughingActionCard = new ActionCard(
    "忍俊不禁",
    "superLaughing",
    "持续3回合-选中棋子不能移动",
    singleTargetSelectorTemplate("忍俊不禁", PieceType.None, (results) => {
        let piece = results[0].data as Piece;
        let modifier = new AttributeModifier((piece_: Piece) => {
            return filterGrids((pos) => false);
        }, 3 * 2);
        piece.movingDestinationsCallback.area(0).modify(modifier);
        piece.attackingTargetsCallback.area(0).modify(modifier);
    })
);
