import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Position } from "./position.js";
import { onPieceClick } from "./selection.js";
import { stop } from "./multiplayer.js";
import { defaultPieceConfigs } from "./defaultPieceConfig.js";
import { Damage, DamageType } from "./damage.js";
export var pieces = [];
class Piece {
    team;
    type;
    position;
    htmlElement;
    health = 0;
    maxHealth = 0;
    attackDamage = 0;
    defense = 0;
    criticalChance = 0;
    criticalDamage = 0;
    damageType = DamageType.None;
    constructor(team, type, position, htmlElement, config = null) {
        this.team = team;
        this.type = type;
        this.position = position;
        this.htmlElement = htmlElement;
        config = config ?? defaultPieceConfigs[this.type];
        if (config) {
            this.attackDamage = config.attackDamage;
            this.defense = config.defense;
            this.criticalChance = config.criticalChance;
            this.criticalDamage = config.criticalDamage;
            this.damageType = config.damageType;
            this.maxHealth = config.maxHealth;
            this.health = this.maxHealth;
        }
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
        if (position.integerGrid().piece !== null)
            return false;
        this.position = position.integerGrid();
        this.draw();
        return true;
    }
    attack(piece) {
        if (piece.team === this.team)
            return false;
        let damageAmount = this.attackDamage;
        if (Math.random() < this.criticalChance)
            damageAmount *= (this.criticalDamage + 1);
        let damageObject = new Damage(this.damageType, damageAmount, this, piece);
        damageObject.apply();
        return true;
    }
    destroyed() {
        if (this.htmlElement)
            this.htmlElement.remove();
        this.position = new Position(-10, -10, true);
        pieces = pieces.filter((p) => p !== this);
        if (this.type === PieceType.Master)
            stop(Team.enemy(this.team));
    }
    /**
     * @returns Destroyed or not
     */
    damaged(damage = null) {
        if (damage === null)
            return;
        let realAmount = damage.amount * Math.pow(2, -this.defense / 1000); // 1000 防御伤害减半
        this.health -= realAmount;
        console.log(damage, realAmount, this.health);
        if (this.health <= 0)
            this.destroyed();
        return this.health <= 0;
    }
}
class PieceType {
    static Master = "master";
    static Guard = "guard";
    static Elephant = "elephant";
    static Horse = "horse";
    static Chariot = "chariot";
    static Gun = "gun";
    static Pawn = "pawn";
}
class Team {
    static Red = "red";
    static Black = "black";
    static enemy(to) {
        return to === Team.Red ? Team.Black : Team.Red;
    }
}
export { Piece, PieceType, Team };
//# sourceMappingURL=piece.js.map