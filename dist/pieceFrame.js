import { getTeamMaster } from "./piece.js";
import { getCurrentTeam, round } from "./round.js";
import { Team } from "./team.js";
export function showPiece(piece) {
    if (!piece.htmlElement)
        return;
    const pieceFrameElement = document.getElementById("piece-frame");
    // let clonePiece = new Piece(
    //     piece.team,
    //     piece.type,
    //     new Position(
    //         pieceFrameElement.clientLeft + pieceFrameElement.clientWidth / 2,
    //         pieceFrameElement.clientTop + pieceFrameElement.clientHeight / 2,
    //         false
    //     ),
    //     pieceFrameElement
    // );
    pieceFrameElement.innerHTML = piece.htmlElement.innerHTML;
    const healthElement = document.getElementById("frame-health");
    const healthMaxElement = document.getElementById("frame-health-max");
    const attackElement = document.getElementById("frame-attack");
    const defenseElement = document.getElementById("frame-defense");
    const criticalElement = document.getElementById("frame-critical");
    const criticalDamageElement = document.getElementById("frame-critical-damage");
    const weight = document.getElementById("frame-weight");
    healthElement.innerText = Math.round(piece.health).toString();
    healthMaxElement.innerText = piece.maxHealth.toExpression();
    attackElement.innerText = piece.attackDamage.toExpression();
    defenseElement.innerText = piece.defense.toExpression();
    criticalElement.innerText = Math.round(piece.criticalChance.result * 100).toString();
    criticalDamageElement.innerText = Math.round(piece.criticalDamage.result * 100).toString();
    weight.innerText = piece.weight.toExpression();
    pieceFrameElement.classList.add(piece.team + "-piece");
    pieceFrameElement.classList.remove(Team.enemy(piece.team) + "-piece");
    const effectsListElement = document.getElementById("effect-list");
    effectsListElement.innerHTML = "";
    if (piece.effects.length === 0)
        effectsListElement.innerHTML = "暂无";
    else
        for (let index = 0; index < piece.effects.length; index++) {
            let effect = piece.effects[index];
            const effectElement = document.createElement("li");
            if (!effect.available) {
                // 直接删除
                piece.effects.splice(index, 1);
                index--;
                continue;
            }
            effectElement.innerHTML = `<span style="color: ${effect.negative ? "darkred" : "black"}">${effect.name}</span>(${effect.expire === -1
                ? "持久"
                : "剩余" + (effect.expire - round + 1).toString() + "轮"}): <span class="description-text">${effect.description}</span>`;
            effectsListElement.appendChild(effectElement);
        }
}
export function showDefaultPiece() {
    const currentTeam = getCurrentTeam();
    const master = getTeamMaster(currentTeam);
    if (master)
        showPiece(master);
}
//# sourceMappingURL=pieceFrame.js.map