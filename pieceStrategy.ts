/**
 * 维护棋子的相关策略。
 */

import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Piece } from "./piece.js";
import { Position } from "./position.js";
import { Serializable, TypeRegistry } from "./serialize.js";

/**
 * 棋子移动策略。
 * 通过 getPosition 方法获取棋子可以移动到的全部位置。
 */
export abstract class PieceMovingStrategy extends Serializable {
    abstract getPosition(piece: Piece): Position[];
}

@TypeRegistry.register()
export class DefaultPieceMovingStrategy extends PieceMovingStrategy {
    getPosition(piece: Piece): Position[] {
        return DefaultMovingBehaviors.auto(piece, false)(piece);
    }
}

export abstract class PieceAttackingStrategy extends Serializable {
    abstract getPosition(piece: Piece): Position[];
}

@TypeRegistry.register()
export class DefaultPieceAttackingStrategy extends PieceAttackingStrategy {
    getPosition(piece: Piece): Position[] {
        return DefaultMovingBehaviors.auto(piece, true)(piece);
    }
}

export abstract class PieceActionStrategy extends Serializable{
    abstract attack(a: Piece, b: Piece): boolean;
}

@TypeRegistry.register()
export class DefaultPieceActionStrategy extends PieceActionStrategy {
    attack(piece: Piece, target: Piece): boolean {
        if (target.team === piece.team) return false; // 不能攻击友军
        let damageObject = piece.SimulateAttack(target);
        damageObject.apply();
        return true;
    }
}