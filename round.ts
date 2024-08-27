import { Team } from "./team.js";

export var round = 0;
export const roundMap = [Team.Red, Team.Black];

export function nextRound() {
    round++;
}

export function getRound() {
    return roundMap[round % 2];
}