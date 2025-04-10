/**
 * 维护棋子的相关策略。
 */
import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Serializable } from "./serialize.js";
/**
 * 棋子移动策略。
 * 通过 getPosition 方法获取棋子可以移动到的全部位置。
 */
export class PieceMovingStrategy extends Serializable {
}
export class DefaultPieceMovingStrategy extends PieceMovingStrategy {
    getPosition(piece) {
        return DefaultMovingBehaviors.auto(piece, false)(piece);
    }
}
export class PieceAttackingStrategy extends Serializable {
}
export class DefaultPieceAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece) {
        return DefaultMovingBehaviors.auto(piece, true)(piece);
    }
}
export class PieceActionStrategy extends Serializable {
}
export class DefaultPieceActionStrategy extends PieceActionStrategy {
    attack(piece, target) {
        if (target.team === piece.team)
            return false; // 不能攻击友军
        let damageObject = piece.SimulateAttack(target);
        damageObject.apply();
        return true;
    }
}
//# sourceMappingURL=pieceStrategy.js.map