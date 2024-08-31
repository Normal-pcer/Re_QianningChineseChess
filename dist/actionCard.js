import { AttributeModifier } from "./attributeProvider.js";
import { ray } from "./defaultMovingBehaviors.js";
import { pieces, PieceType } from "./piece.js";
import { getCurrentSelection, ItemType, SelectionManager, setCurrentSelection, SingleSelection, } from "./selection.js";
import { DamageTrigger, TriggerManager } from "./trigger.js";
import { Vector2 } from "./vector.js";
export class ActionCard {
    name;
    id;
    description;
    applyCallback; // 在使用卡牌时调用
    constructor(name, id, description, applyCallback) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.applyCallback = applyCallback;
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
export const highGunActionCard = new ActionCard("高射炮", "highGun", "允许炮至多隔两个棋子攻击", () => {
    let currentSelection = getCurrentSelection();
    let targetSelection = new SelectionManager(new SingleSelection([], ItemType.Piece, "请选择要应用「高射炮」的棋子", (item) => {
        return item.data.type === PieceType.Gun;
    })).final((results) => {
        let piece = results[0].data;
        let modifier = new AttributeModifier(() => {
            return ray(piece.position, new Vector2(1, 0), 2, 1).concat(ray(piece.position, new Vector2(-1, 0), 2, 1), ray(piece.position, new Vector2(0, 1), 2, 1), ray(piece.position, new Vector2(0, -1), 2, 1));
        }, 3 * 2);
        piece.attackingTargetsCallback.area(0).modify(modifier);
        setCurrentSelection(currentSelection);
        TriggerManager.addTrigger(new DamageTrigger((damage) => {
            if (damage.source === piece) {
                modifier.enabled = false; // 攻击一次就失效
            }
        }));
    });
    setCurrentSelection(targetSelection);
});
//# sourceMappingURL=actionCard.js.map