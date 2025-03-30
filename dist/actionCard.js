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
import { filterGrids, ray } from "./defaultMovingBehaviors.js";
import { StatusEffect } from "./effect.js";
import { RegenerationEffectTemplate, StrengthEffectTemplate, WeaknessEffectTemplate } from "./effectTemplate.js";
import { Piece, PieceType } from "./piece.js";
import { PieceAttackingStrategy, PieceMovingStrategy } from "./pieceStrategy.js";
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
export class TestActionCard extends ActionCard {
    constructor() {
        super("测试卡牌", "test", "这是一个测试卡牌");
    }
    onApply() {
        console.log("使用测试卡牌");
    }
}
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
export class StrengthPotionActionCard extends SelectorActionCard {
    constructor() {
        super("力量药水", "streangthPotion", "持续 3 回合-选中棋子的攻击力提升 15%");
    }
    final(target) {
        let factory = new StrengthEffectTemplate();
        factory.apply(target, 1, 3 * 2);
    }
}
let HighGunAttackingStrategy = class HighGunAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece) {
        return ray(piece.position, new Vector2(1, 0), 2, 1).concat(ray(piece.position, new Vector2(-1, 0), 2, 1), ray(piece.position, new Vector2(0, 1), 2, 1), ray(piece.position, new Vector2(0, -1), 2, 1));
    }
};
HighGunAttackingStrategy = __decorate([
    TypeRegistry.register()
], HighGunAttackingStrategy);
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
//# sourceMappingURL=actionCard.js.map