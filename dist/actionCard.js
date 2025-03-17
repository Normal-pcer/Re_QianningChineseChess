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
import { returnCardById } from "./cardLooting.js";
import { ray } from "./defaultMovingBehaviors.js";
import { StatusEffect } from "./effect.js";
import { Piece, PieceType } from "./piece.js";
import { getCurrentSelection, ItemType, SelectionManager, setCurrentSelection, SingleSelection, } from "./selection.js";
import { Serializable, TypeRegistry } from "./serialize.js";
import { TriggerManager, DamageTrigger } from "./trigger.js";
import { Vector2 } from "./vector.js";
export class ActionCard extends Serializable {
    name;
    id;
    description;
    constructor(name, id, description) {
        super();
        this.name = name;
        this.id = id;
        this.description = description;
    }
}
let TestActionCard = class TestActionCard extends ActionCard {
    constructor() {
        super("测试", "test", "测试用的卡牌");
    }
    apply() {
        console.log("Test Card");
    }
};
TestActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], TestActionCard);
export { TestActionCard };
/**
 * 一些卡牌的基类。
 * 将会进行一次单选棋子，然后基于选中的棋子进行特定操作。
 */
export class SingleTargetSelectorActionCard extends ActionCard {
    pieceType;
    constructor(name, id, description, pieceType) {
        super(name, id, description);
        this.pieceType = pieceType;
    }
    apply() {
        let currentSelection = getCurrentSelection();
        let targetSelection = new SelectionManager(new SingleSelection([], ItemType.Piece, `请选择要应用「${this.name}」的棋子`, (item) => {
            return (item.data.type === this.pieceType ||
                this.pieceType === PieceType.None);
        }))
            .once() // 只允许选择一次
            .oncancel(() => {
            returnCardById(this.id);
        }) // 取消时归还
            .replaceWithFinally(currentSelection) // 恢复前一个选择
            .final((result) => {
            if (result.length !== 0 && result[0].data instanceof Piece) {
                this.final(result[0].data);
            }
            else {
                returnCardById(this.id);
                throw new Error("Selected non-piece item when applying SingleTargetSelectorActionCard");
            }
        });
        setCurrentSelection(targetSelection); // 开始选择
    }
}
class HighGunAttackingStrategy {
    getPosition(piece) {
        return ray(piece.position, new Vector2(1, 0), 2, 1).concat(ray(piece.position, new Vector2(-1, 0), 2, 1), ray(piece.position, new Vector2(0, 1), 2, 1), ray(piece.position, new Vector2(0, -1), 2, 1));
    }
}
/**
 * 高射炮。
 */
let HighGunActionCard = class HighGunActionCard extends SingleTargetSelectorActionCard {
    constructor() {
        super("高射炮", "highGun", "下一次攻击允许间隔至多两个棋子", PieceType.None);
    }
    final(piece) {
        let modifier = new AttributeModifier(new HighGunAttackingStrategy());
        piece.attackingTargetsCallback.area(0).modify(modifier);
        let effect = new StatusEffect("高射炮", "highGun", "下一次攻击允许间隔至多两个棋子", [
            modifier,
        ]);
        piece.pushEffects(effect);
        let pieceElement = piece.htmlElement;
        TriggerManager.addTrigger(new DamageTrigger((damage) => {
            if (damage.source?.htmlElement === pieceElement && pieceElement !== null) {
                effect.disable();
            }
        }));
    }
};
HighGunActionCard = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [])
], HighGunActionCard);
export { HighGunActionCard };
//# sourceMappingURL=actionCard.js.map