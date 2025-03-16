/**
 * 维护棋子的相关策略。
 */
import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
export class DefaultPieceMovingStrategy {
    getPosition(piece) {
        return DefaultMovingBehaviors.auto(piece, false)(piece);
    }
}
export class DefaultPieceAttackingStrategy {
    getPosition(piece) {
        return DefaultMovingBehaviors.auto(piece, true)(piece);
    }
}
export class DefaultPieceActionStrategy {
    attack(piece, target) {
        if (target.team === piece.team)
            return false; // 不能攻击友军
        let damageObject = piece.SimulateAttack(target);
        damageObject.apply();
        return true;
    }
}
//# sourceMappingURL=pieceStrategy.js.map