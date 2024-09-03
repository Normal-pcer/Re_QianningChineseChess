import { Player } from "./player.js";
export class Team {
    static Red = "red";
    static Black = "black";
    static None = "none";
    static enemy(to) {
        switch (to) {
            case Team.Red:
                return Team.Black;
            case Team.Black:
                return Team.Red;
            default:
                return Team.None;
        }
    }
}
export const TeamPlayerMap = {
    [Team.Red]: new Player(Team.Red),
    [Team.Black]: new Player(Team.Black),
    [Team.None]: new Player(Team.None),
};
export function getPlayerFromTeam(team) {
    return TeamPlayerMap[team] ?? TeamPlayerMap[Team.None];
}
export function setPlayerFromTeam(team, player) {
    TeamPlayerMap[team] = player;
}
//# sourceMappingURL=team.js.map