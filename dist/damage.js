import { Piece } from "./piece.js";
import { Team } from "./team.js";
import { defaultQuasiMoveTargets, defaultRepelTargets } from "./defaultDamageBehaviors.js";
import { DamageType } from "./damageType.js";
/**
 * @description 展示一个伤害数字特效
 * @param lastTime 特效持续时间，单位毫秒
 */
function showEffect(damage, targetPosition, lastTime = 750) {
    let effectElement = document.createElement("div");
    let parent = document.getElementById("damage-numbers");
    effectElement.innerText = `${Math.round(damage.realAmount)}`;
    effectElement.className = `damage-effect ${damage.isCritical ? "critical-damage-effect" : ""}`;
    effectElement.style.animation = `damage-number ${lastTime}ms ease-out`;
    if (damage.source?.team === Team.Red) {
        effectElement.style.color = "red";
        effectElement.style.textShadow = "0 0 3px aqua";
    }
    else {
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
    type = DamageType.None;
    amount = 0;
    source = null;
    target = null;
    isCritical = false;
    quasiMoveTarget;
    repelTarget;
    realAmount = 0; /*计算目标的防御力*/
    constructor(type, amount, source, target, isCritical = false, quasiMoveTarget = null, repelTarget = null) {
        this.type = type;
        this.amount = amount;
        this.source = source;
        this.target = target;
        this.isCritical = isCritical;
        this.quasiMoveTarget = quasiMoveTarget ?? defaultQuasiMoveTargets[type];
        this.repelTarget = repelTarget ?? defaultRepelTargets[type];
        this.realAmount = amount * (target ? Math.pow(2, -target.defense.result / 1000) : 1);
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
        showEffect(this, position);
    }
}
//# sourceMappingURL=damage.js.map