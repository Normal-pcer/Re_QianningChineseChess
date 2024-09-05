import { pieces } from "./piece.js";
import { showDefaultPiece } from "./pieceFrame.js";
import { saveCurrent } from "./save.js";
import { getPlayerFromTeam, Team } from "./team.js";
export var round = 0;
export const roundMap = [Team.Red, Team.Black];
export function nextRound() {
    saveCurrent();
    round++;
    console.log(`Round ${round}`);
    getPlayerFromTeam(getCurrentTeam()).showActionCards();
    getPlayerFromTeam(Team.enemy(getCurrentTeam())).showActionCards(false);
    let round_tip = document.querySelector("#round-tip>span");
    round_tip.innerText = getCurrentTeam();
    showDefaultPiece();
    pieces.forEach((p) => {
        p.draw();
    });
}
export function getCurrentTeam() {
    return roundMap[round % 2];
}
export function setRound(r) {
    round = r;
}
//# sourceMappingURL=round.js.map