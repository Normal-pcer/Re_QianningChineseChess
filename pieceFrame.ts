import { getTeamMaster, Piece } from "./piece.js";
import { Position } from "./position.js";
import { getCurrentTeam, round } from "./round.js";
import { Team } from "./team.js";

export function showPiece(piece: Piece) {
    if (!piece.htmlElement) return;
    const pieceFrameElement = document.getElementById("piece-frame") as HTMLDivElement;
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
    const healthElement = document.getElementById("frame-health") as HTMLSpanElement;
    const healthMaxElement = document.getElementById("frame-health-max") as HTMLSpanElement;
    const attackElement = document.getElementById("frame-attack") as HTMLSpanElement;
    const defenseElement = document.getElementById("frame-defense") as HTMLSpanElement;
    const criticalElement = document.getElementById("frame-critical") as HTMLSpanElement;
    const criticalDamageElement = document.getElementById(
        "frame-critical-damage"
    ) as HTMLSpanElement;

    healthElement.innerText = Math.round(piece.health).toString();
    healthMaxElement.innerText = piece.maxHealth.toExpression();
    attackElement.innerText = piece.attackDamage.toExpression();
    defenseElement.innerText = piece.defense.toExpression();
    criticalElement.innerText = Math.round(piece.criticalChance.result * 100).toString();
    criticalDamageElement.innerText = Math.round(piece.criticalDamage.result * 100).toString();

    pieceFrameElement.classList.add(piece.team + "-piece");
    pieceFrameElement.classList.remove(Team.enemy(piece.team) + "-piece");

    const effectsListElement = document.getElementById("effect-list") as HTMLUListElement;
    effectsListElement.innerHTML = "";
    if (piece.effects.length === 0) effectsListElement.innerHTML = "暂无";
    else
        for (const effect of piece.effects) {
            const effectElement = document.createElement("li");
            effectElement.innerHTML = `${effect.name}(${
                effect.expire === -1
                    ? "持久"
                    : "剩余" + (effect.expire - round + 1).toString() + "轮"
            }): <span class="description-text">${effect.description}</span>`;
            effectsListElement.appendChild(effectElement);
        }
}

export function showDefaultPiece() {
    const currentTeam = getCurrentTeam();
    const master = getTeamMaster(currentTeam);
    if (master) showPiece(master);
}
