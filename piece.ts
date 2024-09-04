import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Position } from "./position.js";
import { onPieceClick } from "./selection.js";
import { stop } from "./multiplayer.js";
import { defaultPieceConfigs, PieceConfig } from "./defaultPieceConfig.js";
import { Damage } from "./damage.js";
import { DamageType } from "./damageType.js";
import { Team } from "./team.js";
import { AttributeProvider } from "./attributeProvider.js";

export var pieces: Piece[] = [];

export function modifyPieces(newList: Piece[]) {
    pieces = newList;
}

class Piece {
    team: string;
    type: string;
    position: Position;
    htmlElement: HTMLElement | null;
    htmlElementId: string | null;
    health: number = 0;
    dead: boolean = false;

    maxHealth: AttributeProvider = new AttributeProvider(0);
    attackDamage: AttributeProvider = new AttributeProvider(0);
    defense: AttributeProvider = new AttributeProvider(0);
    criticalChance: AttributeProvider = new AttributeProvider(0);
    criticalDamage: AttributeProvider = new AttributeProvider(0);
    weight: AttributeProvider = new AttributeProvider(0);
    damageType: DamageType = DamageType.None;

    movingDestinationsCallback: AttributeProvider<(piece: Piece) => Position[]>;
    attackingTargetsCallback: AttributeProvider<(piece: Piece) => Position[]>;
    attackActionCallback: AttributeProvider<(piece: Piece, target: Piece) => boolean>;

    clickListener: null | ((ev: MouseEvent) => void) = null;

    constructor(
        team: string,
        type: string,
        position: Position,
        htmlElement: HTMLElement | null,
        config: PieceConfig | null = null
    ) {
        this.team = team;
        this.type = type;
        this.position = position;
        this.htmlElement = htmlElement;
        this.htmlElementId = htmlElement?.id ?? null;

        config = config ?? defaultPieceConfigs[this.type];
        if (config) {
            this.attackDamage = new AttributeProvider(config.attackDamage);
            this.defense = new AttributeProvider(config.defense);
            this.criticalChance = new AttributeProvider(config.criticalChance);
            this.criticalDamage = new AttributeProvider(config.criticalDamage);
            this.damageType = config.damageType;
            this.maxHealth = new AttributeProvider(config.maxHealth);
            this.health = this.maxHealth.result;
            this.weight = new AttributeProvider(config.weight);
        }

        this.movingDestinationsCallback = new AttributeProvider(
            DefaultMovingBehaviors.auto(this, false)
        );
        this.attackingTargetsCallback = new AttributeProvider(
            DefaultMovingBehaviors.auto(this, true)
        );
        this.attackActionCallback = new AttributeProvider((piece, target) => {
            if (target.team === piece.team) return false;
            let damageAmount = piece.attackDamage.result;
            let isCritical = Math.random() < piece.criticalChance.result;
            if (isCritical) damageAmount *= piece.criticalDamage.result + 1;
            let damageObject = new Damage(
                piece.damageType,
                damageAmount,
                piece,
                target,
                isCritical
            );
            damageObject.apply();
            return true;
        });
    }

    toggleSelected() {
        if (!this.htmlElement) return;
        if (this.htmlElement.classList.contains("selected-piece")) {
            this.htmlElement.classList.remove("selected-piece");
        } else {
            let selected = document.getElementsByClassName("selected-piece");
            if (selected != undefined)
                for (let index = 0; index < selected.length; index++) {
                    selected[index].classList.remove("selected-piece");
                }
            this.htmlElement.classList.add("selected-piece");
        }
    }

    get selected() {
        if (!this.htmlElement) return false;
        return this.htmlElement.classList.contains("selected-piece");
    }

    set selected(value) {
        if (!this.htmlElement) return;
        if (value) {
            this.htmlElement.classList.add("selected-piece");
        } else {
            this.htmlElement.classList.remove("selected-piece");
        }
    }

    get destinations() {
        return this.movingDestinationsCallback.result(this);
    }

    get attackTargets() {
        return this.attackingTargetsCallback.result(this);
    }

    init() {
        if (!this.htmlElement) {
            if (!this.htmlElementId) return;
            this.htmlElement = document.getElementById(this.htmlElementId);
            if (!this.htmlElement) return;
        }
        let listener = (event: MouseEvent) => {
            if (onPieceClick(this)) event.stopPropagation();
        };
        this.htmlElement.addEventListener("click", listener);
        this.clickListener = listener;

        // 创建血条（如果没有）
        if (!this.htmlElement.querySelector(".health-bar")) {
            this.htmlElement.innerHTML += `<svg viewBox="0 0 200 200" width="100%" height="100%">
        <path
            d="M 100,10 A 90,90 0 1,1 10,100"
            fill="none"
            stroke="black"
            stroke-width="4"
            class="health-bar"
        />
        </svg>`;
            let healthBar = this.htmlElement.querySelector(".health-bar") as SVGPathElement;
            healthBar.setAttribute("stroke", this.team);
        }
        this.draw();
    }

    draw() {
        if (this.dead || !this.htmlElement) return;
        else this.htmlElement.style.display = "flex";
        // 计算位置
        this.htmlElement.style.left = this.position.getScreenPos()[0] + "px";
        this.htmlElement.style.top = this.position.getScreenPos()[1] + "px";
        // 计算、刷新血条
        let healthProportion = this.health / this.maxHealth.result;
        if (healthProportion >= 1) healthProportion = 0.99999; // 防止血条消失😋
        let arc = healthProportion * 2 * Math.PI;
        let sin = Math.sin(arc);
        let cos = Math.cos(arc);
        let y = 100 - 90 * cos;
        let x = 100 + 90 * sin;
        let largeArcFlag = arc > Math.PI ? 1 : 0;
        let d = `M 100,10 A 90,90 0 ${largeArcFlag},1 ${x},${y}`;
        this.htmlElement.querySelector(".health-bar")?.setAttribute("d", d);
    }

    move(position: Position) {
        if (position.integerGrid().piece !== null) return false;
        this.position = position.integerGrid();
        this.draw();
        return true;
    }

    attack(piece: Piece) {
        return this.attackActionCallback.result(this, piece);
    }

    destroyed() {
        if (this.htmlElement) {
            this.htmlElement.style.display = "none"; // 隐藏棋子
        }
        this.position = new Position(-10, -10, true);
        this.dead = true;

        if (this.type === PieceType.Master) stop(Team.enemy(this.team));
    }

    /**
     * @returns Destroyed or not
     */
    damaged(damage: Damage | null = null) {
        if (damage === null) return;
        let realAmount = damage.realAmount; // 1000 防御伤害减半
        this.health -= realAmount;
        console.log(damage, realAmount, this.health);
        if (this.health <= 0) this.destroyed();
        return this.health <= 0;
    }

    static virtualPiece(position: Position) {
        return new Piece(Team.None, PieceType.None, position, null);
    }

    join() {
        if (!pieces.includes(this)) pieces.push(this);
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
    static None = "none";
}

export { Piece, PieceType };
