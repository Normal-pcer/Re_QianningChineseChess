import { Piece, Team } from "./piece.js";
import { defaultQuasiMoveTargets, defaultRepelTargets } from "./defaultDamageBehaviors.js";
import { Position } from "./position.js";
import { DamageType } from "./damageType.js";

/**
 * @description 展示一个伤害数字特效
 * @param lastTime 特效持续时间，单位毫秒
 */
function showEffect(damage: Damage, targetPosition: Position, lastTime: number = 750) {
    let effectElement = document.createElement("div");
    let parent = document.getElementById("damage-numbers") as HTMLElement;
    effectElement.innerText = `${damage.amount}`;
    effectElement.className = `damage-effect ${damage.isCritical ? "critical-damage-effect" : ""}`;
    effectElement.style.animation = `damage-number ${lastTime}ms ease-out`;
    if (damage.source?.team === Team.Red) {
        effectElement.style.color = "red";
        effectElement.style.textShadow = "0 0 3px aqua";
    } else {
        effectElement.style.color = "black";
        effectElement.style.textShadow = "0 0 3px white";
    }
    setTimeout(() => {
        parent.removeChild(effectElement);
    }, lastTime - 20); // 提前20ms，防止来不及删

    parent.appendChild(effectElement);
    let realWidth = effectElement.offsetWidth;
    let realHeight = effectElement.offsetHeight;
    effectElement.style.left = `${targetPosition.screenX - realWidth / 2}px`;
    effectElement.style.top = `${targetPosition.screenY - realHeight / 2}px`;
}

export class Damage {
    type: DamageType = DamageType.None;
    amount: number = 0;
    source: Piece | null = null;
    target: Piece | null = null;
    isCritical: boolean = false;
    quasiMoveTarget: (piece: Piece, target: Piece) => Position;
    repelTarget: (piece: Piece, target: Piece) => Position;

    constructor(
        type: DamageType,
        amount: number,
        source: Piece | null,
        target: Piece | null,
        isCritical: boolean = false,
        quasiMoveTarget: ((piece: Piece, target: Piece) => Position) | null = null,
        repelTarget: ((piece: Piece, target: Piece) => Position) | null = null
    ) {
        this.type = type;
        this.amount = amount;
        this.source = source;
        this.target = target;
        this.isCritical = isCritical;
        this.quasiMoveTarget = quasiMoveTarget ?? defaultQuasiMoveTargets[type];
        this.repelTarget = repelTarget ?? defaultRepelTargets[type];
    }

    public apply() {
        if (this.target === null) return;
        let position = this.target.position;
        if (this.target.damaged(this) === true) {
            this.source?.move(position);
        } else {
            let virtualMarker = Piece.virtualPiece(this.target.position);
            this.source ? this.target.move(this.repelTarget(this.source, this.target)) : null;
            this.source?.move(this.quasiMoveTarget(this.source, virtualMarker));
        }
        this.target?.draw();
        showEffect(this, position);
    }
}
