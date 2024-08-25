import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Position } from "./position.js";
import { onPieceClick } from "./selection.js";
import { stop } from "./multiplayer.js";
import { defaultPieceConfigs } from "./defaultPieceConfig.js";
import { Damage } from "./damage.js";
import { DamageType } from "./damageType.js";
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
        // 创建血条
        this.htmlElement.innerHTML += `<svg viewBox="0 0 200 200" width="100%" height="100%">
        <path
            d="M 100,10 A 90,90 0 1,1 10,100"
            fill="none"
            stroke="black"
            stroke-width="4"
            class="health-bar"
        />
        </svg>`;
        let healthBar = this.htmlElement.querySelector(".health-bar");
        healthBar.setAttribute("stroke", this.team);
        this.draw();
    }
    draw() {
        if (!this.htmlElement)
            return;
        // 计算位置
        this.htmlElement.style.left = this.position.getScreenPos()[0] + "px";
        this.htmlElement.style.top = this.position.getScreenPos()[1] + "px";
        // 计算、刷新血条
        let healthProportion = this.health / this.maxHealth;
        if (healthProportion == 1)
            healthProportion = 0.99999; // 防止血条消失😋
        let arc = healthProportion * 2 * Math.PI;
        let sin = Math.sin(arc);
        let cos = Math.cos(arc);
        let y = 100 - 90 * cos;
        let x = 100 + 90 * sin;
        let largeArcFlag = arc > Math.PI ? 1 : 0;
        let d = `M 100,10 A 90,90 0 ${largeArcFlag},1 ${x},${y}`;
        this.htmlElement.querySelector(".health-bar")?.setAttribute("d", d);
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
            damageAmount *= this.criticalDamage + 1;
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