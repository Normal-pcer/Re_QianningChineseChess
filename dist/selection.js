import { Position } from "./position.js";
import { Piece, pieces } from "./piece.js";
import { getCurrentTeam, nextRound } from "./round.js";
import { showPiece, showDefaultPiece } from "./pieceFrame.js";
import { runAllSchedules } from "./schedule.js";
/**
 * 返回一个对象本身。
 * //并没有什么用途，只是多套一层会显得很高级
 * 用于统一直接传参和递推传参。
 */
const returnSelf = (obj) => obj;
/**
 * 正在进行的选择器。
 */
var currentSelection = null;
/**
 * 用于监听棋子的点击事件。
 * 将在棋子的eventListener中调用。见Piece.init函数(piece.ts)
 * 如果当前不是在选择棋子则忽略，由其他监听器处理。
 * @param piece 被点击的棋子。
 * @returns 是否处理了该点击事件。
 */
var PieceClickListener = (piece) => {
    let currentSingleSelection = currentSelection?.current;
    let item = new SelectedItem(piece);
    if (currentSingleSelection instanceof SingleSelection && // 一并排除 null 和 undefined
        currentSelection) {
        if (currentSingleSelection.type == ItemType.Piece) {
            // 如果当前不是在选择棋子则忽略
            if (piece.selected) {
                // 如果选择已经被选中的棋子，则视为取消选择。
                piece.selected = false;
                currentSelection?.stop();
            }
            else if (currentSingleSelection.check(item)) {
                piece.selected = true;
                let r = null;
                if (currentSingleSelection.nextCallback != null)
                    r = currentSingleSelection.nextCallback(item);
                currentSelection?.next(r);
                return true;
            }
            else if (currentSingleSelection.temp && currentSingleSelection.autoCancel) {
                // 如果当前选择器允许临时选择，则立即停止并开始替换项。
                currentSelection.stop(false);
                currentSingleSelection = currentSelection?.current;
                if (currentSelection === null)
                    return false; // 没有替换项
                if (currentSingleSelection == null)
                    return false; // 替换项不工作
                if (currentSingleSelection.type !== ItemType.Piece) {
                    // 不匹配
                    if (currentSingleSelection.type === ItemType.Grid) {
                        // 特别地，棋子可以退化成格点
                        // 即允许替换为一次格点点击
                        // 计算实际作用的结果
                        let r = null;
                        if (currentSingleSelection.nextCallback) {
                            r = currentSingleSelection.nextCallback(new SelectedItem(piece.position));
                        }
                        currentSelection.next(r);
                        return true;
                    }
                    return false;
                }
                // 进行选择
                piece.selected = true;
                let r = null;
                if (currentSingleSelection.nextCallback) {
                    r = currentSingleSelection.nextCallback(item);
                }
                currentSelection.next(r);
                return true;
            }
            else {
                if (currentSingleSelection.autoCancel)
                    currentSelection?.stop();
            }
        }
    }
    return false;
};
/**
 * 用于监听屏幕的点击事件。
 * 将在棋盘的eventListener中调用。翻multiplayer.ts去，我记不得在哪。
 * @param position 被点击的位置。
 * @returns 是否处理了该点击事件。
 */
var GameboardClickListener = (position) => {
    let currentSingleSelection = currentSelection?.current;
    let item = new SelectedItem(position);
    if (currentSingleSelection instanceof SingleSelection && currentSingleSelection.type == ItemType.Grid) {
        if (currentSingleSelection.check(item)) {
            let r = null;
            if (currentSingleSelection.nextCallback != null)
                r = currentSingleSelection.nextCallback(item);
            currentSelection?.next(r);
            return true;
        }
        else {
            if (currentSingleSelection.autoCancel)
                currentSelection?.stop();
        }
    }
    return false;
};
/**
 * 选择器。
 *
 * 选择器用于组织单选项（SingleSelection，见下文）。
 */
export class SelectionManager {
    /**
     * 完成选择之后将会调用的回调函数。
     * 仅当所有单选项都正确选择后调用，中断选择不会调用该函数。
     * 当此项为null时，完成选择后不会有更多行为。
     */
    afterSelection = null;
    /**
     * 选择中断或取消之后将会调用的回调函数。
     * 当此项为null时，选择中断或取消后不会有更多行为。
     */
    oncancelCallback = null;
    /**
     * 回调函数的数组，每一项均用于递推计算下一个单选项。
     * 每个回调函数输入先前的选择结果作为参数，返回下一个单选项。
     *
     * 特别地，如果数组项直接为一个单选项(SingleSelection)对象，则会省略调用的过程，恒定使用该单选项。
     */
    recursions;
    /**
     * 当前单选项在recursions数组中的索引。
     * 可以用于确认当前的选择进度。
     */
    index = 0;
    /**
     * 一个布尔值，表示选择器是否选择一次就结束。
     * @see this.cycle
     */
    doOnce;
    /**
     * 当前正在进行选择的单选项。当选择器停止后，该值为null。
     */
    current = null;
    /**
     * 直至现在所有选择的结果。
     */
    results = [];
    /**
     * 选择器停止后用于替换的另一个选择器。
     * 如果为null，则不继续应用任何选择器
     */
    _replaceWithFinally = null;
    temp = false;
    constructor(...singleSelections) {
        this.recursions = singleSelections;
        this.doOnce = true;
        this.reset();
    }
    final(afterSelection) {
        this.afterSelection = afterSelection;
        return this;
    }
    oncancel(oncancel) {
        this.oncancelCallback = oncancel;
        return this;
    }
    then(recursion) {
        this.recursions.push(recursion);
        return this;
    }
    once(once = true) {
        this.doOnce = once;
        return this;
    }
    cycle() {
        return this.once(false);
    }
    replaceWithFinally(manager) {
        this._replaceWithFinally = manager;
        return this;
    }
    reset() {
        this.index = 0;
        this.results = [];
        let first = this.recursions[this.index];
        this.current = first instanceof SingleSelection ? first : first([]);
        // this.current.tip();
    }
    next(result) {
        this.results.push(result);
        if (this.index >= this.recursions.length - 1) {
            this.stop(true);
        }
        else {
            this.index++;
            let future = this.recursions[this.index];
            this.current = future instanceof SingleSelection ? future : future(this.results);
            this.current.tip();
        }
    }
    stop(done = false) {
        // 删除现有的提示
        let action_bar = document.querySelector("#action-bar");
        if (action_bar instanceof HTMLElement)
            action_bar.style.display = "none";
        let action_bar_span = document.querySelector("#action-bar span");
        if (action_bar_span instanceof HTMLElement)
            action_bar_span.innerText = "";
        let results = this.results;
        this.reset();
        if (this.doOnce)
            currentSelection = null;
        else
            this.current?.tip();
        if (this.afterSelection != null && done)
            this.afterSelection(results);
        if (this.oncancelCallback != null && !done)
            this.oncancelCallback(results);
        console.log("stop: ", this);
        pieces.forEach((p) => (p.selected = false));
        if (this._replaceWithFinally != null) {
            this._replaceWithFinally.reset();
            setCurrentSelection(this._replaceWithFinally);
        }
    }
    setTemp(temp = true) {
        this.temp = temp;
        return this;
    }
}
/**
 * @description: Describe the type of single-selection item
 */
export class ItemType {
    static Grid = "grid";
    static Piece = "piece";
    static Custom = "custom";
}
/**
 * @property {string} type - the type of the item
 * @property {Position|Piece} data - the selected position/piece
 */
export class SelectedItem {
    data;
    type;
    constructor(data, type = null) {
        if (type != null)
            this.type = type;
        else {
            if (data instanceof Position)
                this.type = ItemType.Grid;
            else if (data instanceof Piece)
                this.type = ItemType.Piece;
            else
                this.type = ItemType.Custom;
        }
        this.data = data;
    }
    position() {
        return this.data instanceof Position ? this.data : this.data.position;
    }
}
/**
 * @property {Array{Position}} positions - the positions to be highlighted
 * @property {Function} checkCallback - a function to check if the selection is valid
 * @property {string} type - the type of the item
 * @property {string} description - will show on action bar
 * @property {Function?} nextCallback - a function to be called when the selection is valid
 * @property {boolean} autoCancel - whether to cancel the selection automatically when the selection is not valid
 */
export class SingleSelection {
    positions;
    type;
    description;
    checkCallback;
    autoCancel;
    nextCallback;
    /**
     * 是否将选项标记为“临时”。
     * 临时选项被取消后，则会把取消操作直接应用到进一步操作上（若有）。
     */
    temp = false;
    constructor(positions, type, description = null, checkCallback = null, nextCallback = null, autoCancel = true) {
        this.positions = positions;
        this.type = type;
        this.description =
            description === null ? (type === ItemType.Piece ? "请选择一个棋子" : "请选择一个格点") : description;
        this.checkCallback = checkCallback;
        this.autoCancel = autoCancel;
        this.nextCallback = nextCallback === null ? returnSelf : nextCallback;
    }
    check(item) {
        if (this.checkCallback != null) {
            return this.checkCallback(item);
        }
        else {
            return this.positions.some((pos) => pos.nearby(item.position()));
        }
    }
    tip() {
        let element = document.querySelector("#action-bar span");
        if (element instanceof HTMLElement) {
            element.innerText = this.description;
            if (element.parentElement instanceof HTMLElement)
                element.parentElement.style.display = "block";
        }
    }
    setTemp(temp = true) {
        this.temp = temp;
        return this;
    }
}
export class PieceMoveSelection extends SingleSelection {
    constructor(piece) {
        super(piece.destinations, ItemType.Piece);
    }
}
export function setPieceClickListener(listener) {
    PieceClickListener = listener;
}
export function setGameboardClickListener(listener) {
    GameboardClickListener = listener;
}
export function onPieceClick(piece) {
    if (PieceClickListener != null) {
        return PieceClickListener(piece);
    }
    return false;
}
export function onGameboardClick(pos) {
    if (GameboardClickListener != null) {
        return GameboardClickListener(pos);
    }
    return false;
}
export function setCurrentSelection(selection) {
    currentSelection = selection;
    currentSelection?.current?.tip();
}
export function getCurrentSelection() {
    return currentSelection;
}
export function cancelCurrentSelection(continueMainSelection = true) {
    currentSelection?.stop(false);
    if (continueMainSelection) {
        setCurrentSelection(MainSelection);
    }
}
/**
 * @description 主要选择器，在几乎整个游戏周期内使用，用于移动棋子和控制攻击
 */
export const MainSelection = new SelectionManager(new SingleSelection([], ItemType.Piece, "请选择要移动的棋子", (piece) => true))
    .then((past) => {
    let selectedPiece = past[0].data;
    if (getCurrentTeam() !== selectedPiece.team) {
        showPiece(selectedPiece);
        return new SingleSelection([], ItemType.Piece, "查看棋子信息", (grid) => false).setTemp();
    }
    let validMove = selectedPiece.destinations;
    let validTarget = selectedPiece.attackTargets;
    showPiece(selectedPiece);
    return new SingleSelection(validMove.concat(validTarget), ItemType.Grid, "请选择要移动到的位置", (selectedGrid) => {
        let pos = selectedGrid.data;
        if (pos.integerGrid().owner !== null) {
            return validTarget.some((item) => item.nearby(pos));
        }
        else {
            return validMove.some((item) => item.nearby(pos));
        }
    });
})
    .final((results) => {
    let selectedPiece = results[0].data;
    let selectedTarget = results[1].data.integerGrid();
    let success = false;
    if (selectedTarget.owner !== null) {
        success = selectedPiece.attack(selectedTarget.owner);
        console.log(selectedPiece, "attack", selectedTarget.owner, success);
    }
    else {
        success = selectedPiece.move(selectedTarget);
        console.log(selectedPiece, "move", selectedTarget, success);
    }
    if (success) {
        nextRound();
        runAllSchedules();
    }
    showDefaultPiece();
})
    .oncancel(() => {
    showDefaultPiece();
})
    .cycle();
//# sourceMappingURL=selection.js.map