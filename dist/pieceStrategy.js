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
//# sourceMappingURL=pieceStrategy.js.map