/**
 * 维护棋子的相关策略。
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Serializable, TypeRegistry } from "./serialize.js";
/**
 * 棋子移动策略。
 * 通过 getPosition 方法获取棋子可以移动到的全部位置。
 */
export class PieceMovingStrategy extends Serializable {
}
let DefaultPieceMovingStrategy = class DefaultPieceMovingStrategy extends PieceMovingStrategy {
    getPosition(piece) {
        return DefaultMovingBehaviors.auto(piece, false)(piece);
    }
};
DefaultPieceMovingStrategy = __decorate([
    TypeRegistry.register()
], DefaultPieceMovingStrategy);
export { DefaultPieceMovingStrategy };
export class PieceAttackingStrategy extends Serializable {
}
let DefaultPieceAttackingStrategy = class DefaultPieceAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece) {
        return DefaultMovingBehaviors.auto(piece, true)(piece);
    }
};
DefaultPieceAttackingStrategy = __decorate([
    TypeRegistry.register()
], DefaultPieceAttackingStrategy);
export { DefaultPieceAttackingStrategy };
export class PieceActionStrategy extends Serializable {
}
let DefaultPieceActionStrategy = class DefaultPieceActionStrategy extends PieceActionStrategy {
    attack(piece, target) {
        if (target.team === piece.team)
            return false; // 不能攻击友军
        let damageObject = piece.SimulateAttack(target);
        damageObject.apply();
        return true;
    }
};
DefaultPieceActionStrategy = __decorate([
    TypeRegistry.register()
], DefaultPieceActionStrategy);
export { DefaultPieceActionStrategy };
//# sourceMappingURL=pieceStrategy.js.map