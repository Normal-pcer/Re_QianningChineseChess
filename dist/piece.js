import { DefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { Position } from "./position.js";
import { onPieceClick } from "./selection.js";
import { stop } from "./multiplayer.js";
import { defaultPieceConfigs } from "./defaultPieceConfig.js";
import { Damage } from "./damage.js";
import { DamageType } from "./damageType.js";
import { Team } from "./team.js";
import { AttributeProvider, NumberAttributeProvider } from "./attributeProvider.js";
import { registerAnonymous } from "./callbackRegister.js";
import { schedule } from "./schedule.js";
import { fixedRandom } from "./random.js";
import { round } from "./round.js";
const damageFloatLimit = 0.02;
const defaultAttackActionCallback = registerAnonymous((piece, target) => {
    if (target.team === piece.team)
        return false;
    let damageAmount = piece.attackDamage.result;
    let isCritical = fixedRandom("criticalCheck", round, piece.position.toString(), target.position.toString()) <
        piece.criticalRate.result;
    if (isCritical)
        damageAmount *= piece.criticalDamage.result + 1;
    let float = fixedRandom("damageFloat", round, piece.position.toString(), target.position.toString()) *
        damageFloatLimit *
        2 +
        (1 - damageFloatLimit);
    let damageObject = new Damage(piece.damageType, damageAmount * float, piece, target, isCritical);
    damageObject.apply();
    return true;
});
export var pieces = [];
export function modifyPieces(newList) {
    pieces = newList;
}
class Piece {
    /**
     * 棋子的阵营，为Team枚举值(team.ts)中的一个。
     * Team.Red表示红方，Team.Black表示黑方，Team.None表示无阵营（仅用于特殊棋子）。
     */
    team;
    /**
     * 棋子的类型，为PieceType枚举值(当前文件下方)中的一个。
     * 例如：PieceType.Horse表示「马」
     */
    type;
    /**
     * 棋子所处的位置，为Position对象(position.ts)。
     */
    position;
    /**
     * 棋子的HTML元素，为HTMLElement对象，可以为空。
     * 如果为空时，包括点击事件在内的一些交互功能将不可用。
     */
    htmlElement;
    /**
     * 棋子的HTML元素的ID，为字符串，可以为空。
     * 仅在一些不能存储HTMLElement对象的场合使用。
     */
    htmlElementId;
    /**
     * 棋子的生命值。
     *
     * TODO 更改为Getter和Setter，用于防止溢出、增加生命值上限时自动提升等。
     */
    health = 0;
    /**
     * 棋子是否已经死亡
     */
    dead = false;
    /**
     * 棋子的最大生命值，为一个数值提供器(attributeProvider.ts)。
     */
    maxHealth = new NumberAttributeProvider(0);
    /**
     * 棋子的攻击力，为一个数值提供器(attributeProvider.ts)。
     */
    attackDamage = new NumberAttributeProvider(0);
    /**
     * 棋子的防御力，为一个数值提供器(attributeProvider.ts)。
     * 防御力会降低棋子受到的伤害，计算方式见damage.ts。
     */
    defense = new NumberAttributeProvider(0);
    /**
     * 棋子的暴击率，为一个数值提供器(attributeProvider.ts)。
     * 暴击率表示棋子攻击时暴击的概率。1表示一定暴击，0表示不可能暴击。
     */
    criticalRate = new NumberAttributeProvider(0);
    /**
     * 棋子的暴击伤害倍率，为一个数值提供器(attributeProvider.ts)。
     * 暴击伤害倍率表示棋子暴击时伤害的加成。0表示暴击伤害等于普通伤害，1表示暴击伤害是普通伤害的两倍。
     * 暴击增伤在攻击力之后结算。
     */
    criticalDamage = new NumberAttributeProvider(0);
    /**
     * 棋子的重量，为一个数值提供器(attributeProvider.ts)。
     * 重量会影响棋子被击退的行为。重量高的棋子有更高的概率减免击退，见defaultDamageBehavior.ts。
     */
    weight = new NumberAttributeProvider(0);
    /**
     * 棋子的伤害类型，为DamageType枚举值(damageType.ts)中的一个。
     */
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
            this.criticalRate = new NumberAttributeProvider(config.criticalChance);
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
                        schedule(() => {
                            this.pushEffects(lowerLevel);
                        }, higherLevel.expire + 1);
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