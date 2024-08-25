import { Piece } from "./piece.js";
import { defaultQuasiMoveTargets } from "./defaultDamageBehaviors.js";
import { Position } from "./position.js";

export enum DamageType {
    None,
    MeleeLow,
    MeleeMedium,
    MeleeHigh,
    Ranged,
}

export class Damage {
    type: DamageType = DamageType.None;
    amount: number = 0;
    source: Piece | null = null;
    target: Piece | null = null;
    quasiMoveTarget: (piece: Piece, target: Piece) => Position;
    repelTarget: (piece: Piece, target: Piece) => Position;

    constructor(
        type: DamageType,
        amount: number,
        source: Piece | null,
        target: Piece | null,
        quasiMoveTarget: ((piece: Piece, target: Piece) => Position) | null = null,
        repelTarget: ((piece: Piece, target: Piece) => Position) | null = null
    ) {
        this.type = type;
        this.amount = amount;
        this.source = source;
        this.target = target;
        this.quasiMoveTarget = quasiMoveTarget ?? defaultQuasiMoveTargets[type];
        this.repelTarget = repelTarget ?? defaultQuasiMoveTargets[type];
    }

    public apply() {
        if (this.target?.damaged(this) === true) {
            this.source?.move(this.target.position);
        } else {
            this.target ? this.source?.move(this.quasiMoveTarget(this.source, this.target)) : "qwq";
        }
    }
}
