import { Piece } from "./piece.js";
import { defaultQuasiMoveTargets, defaultRepelTargets } from "./defaultDamageBehaviors.js";
import { DamageType } from "./damageType.js";
export class Damage {
    type = DamageType.None;
    amount = 0;
    source = null;
    target = null;
    quasiMoveTarget;
    repelTarget;
    constructor(type, amount, source, target, quasiMoveTarget = null, repelTarget = null) {
        this.type = type;
        this.amount = amount;
        this.source = source;
        this.target = target;
        this.quasiMoveTarget = quasiMoveTarget ?? defaultQuasiMoveTargets[type];
        this.repelTarget = repelTarget ?? defaultRepelTargets[type];
    }
    apply() {
        if (this.target === null)
            return;
        let position = this.target.position;
        if (this.target.damaged(this) === true) {
            this.source?.move(position);
        }
        else {
            let virtualMarker = Piece.virtualPiece(this.target.position);
            this.source ? this.target.move(this.repelTarget(this.source, this.target)) : null;
            this.source?.move(this.quasiMoveTarget(this.source, virtualMarker));
        }
        this.target?.draw();
    }
}
//# sourceMappingURL=damage.js.map