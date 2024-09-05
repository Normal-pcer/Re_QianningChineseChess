import { getTeamMaster, Piece } from "./piece.js";
import { Position } from "./position.js";
import { getCurrentTeam } from "./round.js";
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
    healthMaxElement.innerText = Math.round(piece.maxHealth.result).toString();
    attackElement.innerText = Math.round(piece.attackDamage.result).toString();
    defenseElement.innerText = Math.round(piece.defense.result).toString();
    criticalElement.innerText = Math.round(piece.criticalChance.result * 100).toString();
    criticalDamageElement.innerText = Math.round(piece.criticalDamage.result * 100).toString();

    pieceFrameElement.classList.add(piece.team + "-piece");
    pieceFrameElement.classList.remove(Team.enemy(piece.team) + "-piece");
}

export function showDefaultPiece() {
    const currentTeam = getCurrentTeam();
    const master = getTeamMaster(currentTeam);
    if (master) showPiece(master);
}
