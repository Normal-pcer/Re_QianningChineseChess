import { saveCurrent } from "./save.js";
import { getPlayerFromTeam, Team } from "./team.js";
export var round = 0;
export const roundMap = [Team.Red, Team.Black];
export function nextRound() {
    saveCurrent();
    round++;
    console.log(`Round ${round}`);
    getPlayerFromTeam(getCurrentTeam()).showActionCards();
    let round_tip = document.querySelector("#round-tip>span");
    round_tip.innerText = getCurrentTeam();
}
export function getCurrentTeam() {
    return roundMap[round % 2];
}
export function setRound(r) {
    round = r;
}
//# sourceMappingURL=round.js.map