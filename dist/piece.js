import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Position } from "./position.js";
import { onPieceClick } from "./selection.js";
import { stop } from "./multiplayer.js";
export var pieces = [];
class Piece {
    constructor(team, type, position, htmlElement) {
        this.team = team;
        this.type = type;
        this.position = position;
        this.htmlElement = htmlElement;
    }
    toggleSelected() {
        if (!this.htmlElement)
            return;
        if (this.htmlElement.classList.contains("selected-piece")) {
            this.htmlElement.classList.remove("selected-piece");
        }
        else {
            let selected = document.getElementsByClassName("selected-piece");
            if (selected != undefined)
                for (let index = 0; index < selected.length; index++) {
                    selected[index].classList.remove("selected-piece");
                }
            this.htmlElement.classList.add("selected-piece");
        }
    }
    get selected() {
        if (!this.htmlElement)
            return false;
        return this.htmlElement.classList.contains("selected-piece");
    }
    set selected(value) {
        if (!this.htmlElement)
            return;
        if (value) {
            this.htmlElement.classList.add("selected-piece");
        }
        else {
            this.htmlElement.classList.remove("selected-piece");
        }
    }
    get destinations() {
        return DefaultMovingBehaviors.auto(this);
    }
    get attackTargets() {
        return DefaultMovingBehaviors.auto(this, true);
    }
    init() {
        if (!this.htmlElement)
            return;
        this.htmlElement.addEventListener("click", (event) => {
            if (onPieceClick(this))
                event.stopPropagation();
        });
        this.draw();
    }
    draw() {
        if (!this.htmlElement)
            return;
        this.htmlElement.style.left = this.position.getScreenPos()[0] + "px";
        this.htmlElement.style.top = this.position.getScreenPos()[1] + "px";
    }
    move(position) {
        if (position.integerGrid.piece !== null)
            return false;
        this.position = position.integerGrid;
        this.draw();
        return true;
    }
    attack(piece) {
        if (piece.team === this.team)
            return false;
        let pos = piece.position;
        piece.damaged();
        this.move(pos);
        return true;
    }
    damaged() {
        if (this.htmlElement)
            this.htmlElement.remove();
        this.position = new Position(-10, -10, true);
        pieces = pieces.filter((p) => p !== this);
        if (this.type === PieceType.Master)
            stop(Team.enemy(this.team));
    }
}
class PieceType {
}
PieceType.Master = "master";
PieceType.Guard = "guard";
PieceType.Elephant = "elephant";
PieceType.Horse = "horse";
PieceType.Chariot = "chariot";
PieceType.Gun = "gun";
PieceType.Pawn = "pawn";
class Team {
    static enemy(to) {
        return to === Team.Red ? Team.Black : Team.Red;
    }
}
Team.Red = "red";
Team.Black = "black";
export { Piece, PieceType, Team };
