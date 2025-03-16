/**
 * 维护棋子的相关策略。
 */

import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Piece } from "./piece.js";
import { Position } from "./position.js";

/**
 * 棋子移动策略。
 * 通过 getPosition 方法获取棋子可以移动到的全部位置。
 */
export interface PieceMovingStrategy {
    getPosition(piece: Piece): Position[];
}

export class DefaultPieceMovingStrategy implements PieceMovingStrategy {
    getPosition(piece: Piece): Position[] {
        return DefaultMovingBehaviors.auto(piece, false)(piece);
    }
}

export interface PieceAttackingStrategy {
    getPosition(piece: Piece): Position[];
}

export class DefaultPieceAttackingStrategy implements PieceAttackingStrategy {
    getPosition(piece: Piece): Position[] {
        return DefaultMovingBehaviors.auto(piece, true)(piece);
    }
}
