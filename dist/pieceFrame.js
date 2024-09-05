import { getTeamMaster } from "./piece.js";
import { getCurrentTeam } from "./round.js";
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
    healthElement.innerText = piece.health.toString();
    healthMaxElement.innerText = piece.maxHealth.result.toString();
    attackElement.innerText = piece.attackDamage.result.toString();
    defenseElement.innerText = piece.defense.result.toString();
    criticalElement.innerText = (piece.criticalChance.result * 100).toString();
    criticalDamageElement.innerText = (piece.criticalDamage.result * 100).toString();
    pieceFrameElement.classList.add(piece.team + "-piece");
    pieceFrameElement.classList.remove(Team.enemy(piece.team) + "-piece");
}
export function showDefaultPiece() {
    const currentTeam = getCurrentTeam();
    const master = getTeamMaster(currentTeam);
    if (master)
        showPiece(master);
}
//# sourceMappingURL=pieceFrame.js.map