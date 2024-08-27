export class Team {
    static Red = "red";
    static Black = "black";
    static None = "none";

    static enemy(to: string) {
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