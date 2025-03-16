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
import { DefaultPieceMovingStrategy, DefaultPieceAttackingStrategy, DefaultPieceActionStrategy } from "./pieceStrategy.js";
/**
 * 伤害浮动范围。伤害浮动在暴击之后结算，会影响Damage对象的amount属性。
 * 0.02表示伤害浮动会造成原始伤害的98%到102%。
 */
const damageFloatLimit = 0.02;
const defaultAttackActionCallback = registerAnonymous((piece, target) => {
    if (target.team === piece.team)
        return false; // 不能攻击友军
    let damageObject = piece.SimulateAttack(target);
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
     * TODO: 更改为Getter和Setter，用于防止溢出、增加生命值上限时自动提升等。
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
     * 重量**不会**影响棋子的主动移动。
     */
    weight = new NumberAttributeProvider(0);
    /**
     * 棋子的伤害类型，为DamageType枚举值(damageType.ts)中的一个。
     * 伤害类型会影响棋子攻击时的自身移动和击退。
     */
    damageType = DamageType.None;
    /**
     * 一个属性提供器，返回值为一个回调函数，用于获取棋子可能移动到的位置。
     */
    movingDestinationsCallbackProvider;
    /**
     * 一个属性提供器，返回值为一个回调函数，用于获取棋子可能攻击到的棋子。
     */
    attackingTargetsCallback;
    /**
     * 一个属性提供器，返回值为一个回调函数，用于执行棋子的攻击动作。
     * 回调函数的返回值表示攻击成功与否。攻击失败的原因可能是攻击目标不是敌方棋子等。
     */
    attackActionCallbackProvider;
    /**
     * 棋子的点击事件监听器，为回调函数，可以为空。
     */
    clickListener = null;
    /**
     * 棋子的状态效果列表。
     */
    statusEffects = [];
    constructor(team, type, position, htmlElement, config = null) {
        this.team = team;
        this.type = type;
        this.position = position;
        this.htmlElement = htmlElement;
        this.htmlElementId = htmlElement?.id ?? null;
        // 根据棋子类型获取默认初始数值
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
        // 初始化回调函数提供器
        this.movingDestinationsCallbackProvider = new AttributeProvider(new DefaultPieceMovingStrategy());
        this.attackingTargetsCallback = new AttributeProvider(new DefaultPieceAttackingStrategy());
        this.attackActionCallbackProvider = new AttributeProvider(new DefaultPieceActionStrategy());
    }
    /**
     * 选中或取消选中棋子。
     * 如果棋子的htmlElement为空，则不执行任何操作。
     */
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
    /**
     * 初始化棋子。会将棋子绑定到对应的html元素上，并添加点击事件监听器和血条。
     */
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
    /**
     * 绘制棋子。将会更新棋子html元素的位置和一些状态。
     * 如果棋子死亡或者htmlElement为空，则不执行任何操作。
     *
     * 具体流程：
     * - 移动到正确的位置。
     * - 更新血条。将会用一个圆心角不等的圆弧来表示生命值的比例。
     * - 检查是否有状态效果，并添加对应类名。
     *
     * TODO 拆分不同流程至不同函数
     */
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
            healthProportion = 0.99999; // 防止血条消失
        let arc = healthProportion * 2 * Math.PI;
        let sin = Math.sin(arc);
        let cos = Math.cos(arc);
        let y = 100 - 90 * cos;
        let x = 100 + 90 * sin;
        let largeArcFlag = arc > Math.PI ? 1 : 0;
        let d = `M 100,10 A 90,90 0 ${largeArcFlag},1 ${x},${y}`;
        this.htmlElement.querySelector(".health-bar")?.setAttribute("d", d);
        // 检查是否有有效的状态效果
        this.statusEffects = this.statusEffects.filter((effect) => effect.available);
        let hasEffect = this.statusEffects.some((effect) => effect.available);
        let allNegative = hasEffect && this.statusEffects.every((effect) => effect.negative);
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
    /**
     * 添加状态效果。
     * 将会自动处理相同效果的覆盖问题。具体来讲，id相同的效果被视为相同效果，应用以下逻辑：
     * - 如果效果等级相同，或不应用等级机制（即level为空），则效果过期时间取最大值，即刷新时间
     * - 如果效果等级不同，则高等级效果会替代低等级。特别地，如果低等级效果更晚过期，则在高等级效果过期后重新应用。
     * 同时，这种情况下，会自动禁用被替代效果及其关联的修饰符。
     * 特别地，「不可用」的效果将被忽略。
     */
    pushEffects(...effects) {
        for (let i = 0; i < effects.length; i++) {
            let effect = effects[i];
            if (!effect.available)
                return; // 忽略不可用效果
            let exist = this.statusEffects.find((e) => e.id == effect.id);
            if (!exist) {
                this.statusEffects.push(effect);
            }
            else {
                if (exist.level === effect.level || effect.level === null || exist.level === null) {
                    exist.expire = Math.max(exist.expire, effect.expire);
                    effect.disable();
                }
                else {
                    let higherLevel = exist.level > effect.level ? exist : effect;
                    let lowerLevel = exist.level > effect.level ? effect : exist;
                    lowerLevel.disable(); // 临时禁用已经存在的效果
                    this.statusEffects.splice(this.statusEffects.indexOf(exist), 1);
                    this.statusEffects.push(higherLevel);
                    this.statusEffects[this.statusEffects.length - 1].enable(); // 启用新的效果
                    // 解释上述操作的原因
                    // 如果原先的效果更强，则会被移除、重新加入和启用，新效果则被禁用。
                    // 如果新的效果更强，原效果被禁用和移除，新效果被加入和启用。
                    // 如果不进行这样的操作，原效果关联的修饰符会持续启用，导致效果实际上会叠加
                    if (lowerLevel.expire > higherLevel.expire) { // 计划重新启用
                        schedule(() => {
                            this.pushEffects(lowerLevel);
                        }, higherLevel.expire + 1);
                    }
                }
            }
        }
        this.draw();
    }
    /**
     * 移动到指定位置，并自动重绘以更新位置。
     * @returns 是否移动成功。失败的原因可能为目标位置已经有棋子。
     */
    move(targetPosition) {
        if (targetPosition.integerGrid().owner !== null)
            return false;
        this.position = targetPosition.integerGrid();
        this.draw();
        return true;
    }
    /**
     * 「模拟」对一个棋子进行攻击，并返回伤害对象。
     * 该操作仅有数值上的计算，不会造成实际影响。
     * @param targetPiece 被攻击的棋子。必须提供，用于构造伤害对象，和用于生成随机值。
     * @returns 本次攻击的伤害对象。
     */
    SimulateAttack(targetPiece) {
        let damageAmount = this.attackDamage.result;
        let isCritical = fixedRandom("criticalCheck", round, this.position.toString(), targetPiece.position.toString()) < this.criticalRate.result;
        if (isCritical)
            damageAmount *= this.criticalDamage.result + 1;
        let float = fixedRandom("damageFloat", round, this.position.toString(), targetPiece.position.toString()) *
            damageFloatLimit *
            2 +
            (1 - damageFloatLimit);
        let damageObject = new Damage(this.damageType, damageAmount * float, this, targetPiece, isCritical);
        return damageObject;
    }
    /**
     * 攻击一个目标棋子。
     * 将会获取棋子的「攻击行为」回调参数并调用，并返回其返回值。
     * @returns 回调参数的返回值。应当表示是否攻击成功。
     */
    attack(targetPiece) {
        return this.attackActionCallbackProvider.result.attack(this, targetPiece);
    }
    /**
     * 被摧毁/杀死。
     * 这不会移除棋子，而是将其设为无效，移至无效位置，并隐藏其HTML元素。
     */
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
     * 受到一次伤害。
     * 将会自动计算生命值，若生命值小于等于0，则自动调用死亡方法。
     * @param damage 伤害对象。如果为null，则表示受到无伤害。
     * @returns 伤害是否「致命」，即导致棋子死亡。
     */
    damaged(damage = null) {
        if (damage === null)
            return;
        let realAmount = damage.realAmount; // 1000 防御伤害减半
        this.health -= realAmount;
        if (this.health <= 0)
            this.destroyed();
        return this.health <= 0;
    }
    /**
     * 创建一个虚拟棋子。
     * 虚拟棋子没有阵营、类型、HTML元素等属性，仅作占位用途。
     * @param piecePosition
     * @returns 新的棋子对象
     */
    static virtualPiece(piecePosition) {
        return new Piece(Team.None, PieceType.None, piecePosition, null);
    }
    /**
     * 加入到棋子列表中。
     * 如果棋子已经存在，则不会重复添加。
     */
    join() {
        if (!pieces.includes(this))
            pieces.push(this);
    }
    /**
     * 是否被选中。
     * 如果棋子没有HTML元素，则永远返回false。
     */
    get selected() {
        if (!this.htmlElement)
            return false;
        return this.htmlElement.classList.contains("selected-piece");
    }
    /**
     * 设置是否被选中。
     * 如果棋子没有HTML元素，则不会做任何操作。
     */
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
    /**
     * 获取棋子可能的移动目标位置。
     * 将会获取棋子的「移动行为」回调参数并调用，并返回其返回值。
     */
    get destinations() {
        return this.movingDestinationsCallbackProvider.result.getPosition(this);
    }
    /**
     * 获取棋子可能的攻击目标位置。
     * 将会获取棋子的「攻击行为」回调参数并调用，并返回其返回值。
     */
    get attackTargets() {
        return this.attackingTargetsCallback.result.getPosition(this);
    }
}
/**
 * 棋子类型。
 * TODO: 重构成typescript的enum类型
 */
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
/**
 * 获取指定阵营的将或者帅。
 * @param team 阵营
 * @returns 获取到的棋子。如果没有找到，则返回null。
 */
export function getTeamMaster(team) {
    return pieces.find((piece) => piece.team === team && piece.type === PieceType.Master) ?? null;
}
//# sourceMappingURL=piece.js.map