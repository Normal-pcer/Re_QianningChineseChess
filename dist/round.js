import { Team } from "./team.js";
export var round = 0;
export const roundMap = [Team.Red, Team.Black];
export function nextRound() {
    round++;
    console.log(`Round ${round}`);
}
export function getCurrentTeam() {
    return roundMap[round % 2];
}
//# sourceMappingURL=round.js.map