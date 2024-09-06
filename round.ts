import { pieces } from "./piece.js";
import { showDefaultPiece } from "./pieceFrame.js";
import { saveCurrent } from "./save.js";
import { runAllSchedules } from "./schedule.js";
import { getPlayerFromTeam, Team } from "./team.js";

export var round = 0;
export const roundMap = [Team.Red, Team.Black];

export function nextRound() {
    saveCurrent();
    round++;
    console.log(`Round ${round}`);
    // TriggerManager.trigger(RoundTrigger.name, round);
    runAllSchedules();
    getPlayerFromTeam(getCurrentTeam()).showActionCards();
    getPlayerFromTeam(Team.enemy(getCurrentTeam())).showActionCards(false);
    let round_tip = document.querySelector("#round-tip>span") as HTMLElement;
    round_tip.innerText = getCurrentTeam();
    showDefaultPiece();
    pieces.forEach((p) => {
        p.draw();
    });
}

export function getCurrentTeam() {
    return roundMap[round % 2];
}

export function setRound(r: number) {
    round = r;
}
