import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Position } from "./position.js";
import { onPieceClick } from "./selection.js";
import { stop } from "./multiplayer.js";
import { defaultPieceConfigs } from "./defaultPieceConfig.js";
import { Damage } from "./damage.js";
import { DamageType } from "./damageType.js";
import { Team } from "./team.js";
import { AttributeProvider, NumberAttributeProvider, } from "./attributeProvider.js";
import { registerAnonymous } from "./callbackRegister.js";
import { RoundTrigger, TriggerManager } from "./trigger.js";
const defaultAttackActionCallback = registerAnonymous((piece, target) => {
    if (target.team === piece.team)
        return false;
    let damageAmount = piece.attackDamage.result;
    let isCritical = Math.random() < piece.criticalChance.result;
    if (isCritical)
        damageAmount *= piece.criticalDamage.result + 1;
    let damageObject = new Damage(piece.damageType, damageAmount, piece, target, isCritical);
    damageObject.apply();
    return true;
});
export var pieces = [];
export function modifyPieces(newList) {
    pieces = newList;
}
class Piece {
    team;
    type;
    position;
    htmlElement;
    htmlElementId;
    health = 0;
    dead = false;
    maxHealth = new NumberAttributeProvider(0);
    attackDamage = new NumberAttributeProvider(0);
    defense = new NumberAttributeProvider(0);
    criticalChance = new NumberAttributeProvider(0);
    criticalDamage = new NumberAttributeProvider(0);
    weight = new NumberAttributeProvider(0);
    damageType = DamageType.None;
    movingDestinationsCallback;
    attackingTargetsCallback;
    attackActionCallback;
    clickListener = null;
    effects = [];
    constructor(team, type, position, htmlElement, config = null) {
        this.team = team;
        this.type = type;
        this.position = position;
        this.htmlElement = htmlElement;
        this.htmlElementId = htmlElement?.id ?? null;
        config = config ?? defaultPieceConfigs[this.type];
        if (config) {
            this.attackDamage = new NumberAttributeProvider(config.attackDamage);
            this.defense = new NumberAttributeProvider(config.defense);
            this.criticalChance = new NumberAttributeProvider(config.criticalChance);
            this.criticalDamage = new NumberAttributeProvider(config.criticalDamage);
            this.damageType = config.damageType;
            this.maxHealth = new NumberAttributeProvider(config.maxHealth);
            this.health = this.maxHealth.result;
            this.weight = new NumberAttributeProvider(config.weight);
        }
        this.movingDestinationsCallback = new AttributeProvider(DefaultMovingBehaviors.auto(this, false));
        this.attackingTargetsCallback = new AttributeProvider(DefaultMovingBehaviors.auto(this, true));
        this.attackActionCallback = new AttributeProvider(defaultAttackActionCallback);
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
    pushEffects(...effects) {
        for (let i = 0; i < effects.length; i++) {
            let effect = effects[i];
            if (!effect.available)
                return;
            let exist = this.effects.find((e) => e.id == effect.id);
            if (!exist)
                this.effects.push(effect);
            else {
                if (exist.level === effect.level || effect.level === null || exist.level === null) {
                    exist.expire = Math.max(exist.expire, effect.expire);
                }
                else {
                    // 等级更高的效果，替换掉低的效果；如果低等级效果过期更晚，则在过期后替换回来
                    let higherLevel = exist.level > effect.level ? exist : effect;
                    let lowerLevel = exist.level > effect.level ? effect : exist;
                    this.effects.splice(this.effects.indexOf(exist), 1);
                    this.effects.push(higherLevel);
                    if (lowerLevel.expire > higherLevel.expire) {
                        TriggerManager.addTrigger(new RoundTrigger((round) => {
                            if (round === higherLevel.expire + 1) {
                                this.pushEffects(lowerLevel);
                            }
                        }));
                    }
                }
            }
        }
        this.draw();
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
        return this.movingDestinationsCallback.result(this);
    }
    get attackTargets() {
        return this.attackingTargetsCallback.result(this);
    }
    init() {
        if (!this.htmlElement) {
            if (!this.htmlElementId)
                return;
            this.htmlElement = document.getElementById(this.htmlElementId);
            if (!this.htmlElement)
                return;
        }
        let listener = (event) => {
            if (onPieceClick(this))
                event.stopPropagation();
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
            let healthBar = this.htmlElement.querySelector(".health-bar");
            healthBar.setAttribute("stroke", this.team);
        }
        this.draw();
    }
    draw() {
        if (this.dead || !this.htmlElement)
            return;
        else
            this.htmlElement.style.display = "flex";
        // 计算位置
        this.htmlElement.style.left = this.position.getScreenPos()[0] + "px";
        this.htmlElement.style.top = this.position.getScreenPos()[1] + "px";
        // 计算、刷新血条
        let healthProportion = this.health / this.maxHealth.result;
        if (healthProportion >= 1)
            healthProportion = 0.99999; // 防止血条消失😋
        let arc = healthProportion * 2 * Math.PI;
        let sin = Math.sin(arc);
        let cos = Math.cos(arc);
        let y = 100 - 90 * cos;
        let x = 100 + 90 * sin;
        let largeArcFlag = arc > Math.PI ? 1 : 0;
        let d = `M 100,10 A 90,90 0 ${largeArcFlag},1 ${x},${y}`;
        this.htmlElement.querySelector(".health-bar")?.setAttribute("d", d);
        // 检查是否有有效的状态效果
        this.effects = this.effects.filter((effect) => effect.available);
        let hasEffect = this.effects.some((effect) => effect.available);
        let allNegative = hasEffect && this.effects.every((effect) => effect.negative);
        if (allNegative) {
            this.htmlElement.classList.remove("has-effect");
            this.htmlElement.classList.add("has-negative-effect");
        }
        else if (hasEffect) {
            this.htmlElement.classList.add("has-effect");
            this.htmlElement.classList.remove("has-negative-effect");
        }
        else {
            this.htmlElement.classList.remove("has-effect");
            this.htmlElement.classList.remove("has-negative-effect");
        }
    }
    move(position) {
        if (position.integerGrid().piece !== null)
            return false;
        this.position = position.integerGrid();
        this.draw();
        return true;
    }
    attack(piece) {
        return this.attackActionCallback.result(this, piece);
    }
    destroyed() {
        if (this.htmlElement) {
            this.htmlElement.style.display = "none"; // 隐藏棋子
        }
        this.position = new Position(-10, -10, true);
        this.dead = true;
        if (this.type === PieceType.Master)
            stop(Team.enemy(this.team));
    }
    /**
     * @returns Destroyed or not
     */
    damaged(damage = null) {
        if (damage === null)
            return;
        let realAmount = damage.realAmount; // 1000 防御伤害减半
        this.health -= realAmount;
        console.log(damage, realAmount, this.health);
        if (this.health <= 0)
            this.destroyed();
        return this.health <= 0;
    }
    static virtualPiece(position) {
        return new Piece(Team.None, PieceType.None, position, null);
    }
    join() {
        if (!pieces.includes(this))
            pieces.push(this);
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
export function getTeamMaster(team) {
    return pieces.find((piece) => piece.team === team && piece.type === PieceType.Master);
}
//# sourceMappingURL=piece.js.map