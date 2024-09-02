import { Position } from "./position.js";
import { Piece, pieces } from "./piece.js";
const returnSelf = (obj) => obj;
var currentSelection = null;
var PieceClickListener = (piece) => {
    let currentSingleSelection = currentSelection?.current;
    let item = new SelectedItem(piece);
    if (currentSingleSelection instanceof SingleSelection &&
        currentSingleSelection.type == ItemType.Piece) {
        if (piece.selected) {
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
        else {
            if (currentSingleSelection.autoCancel)
                currentSelection?.stop();
        }
    }
    return false;
};
var GameboardClickListener = (position) => {
    let currentSingleSelection = currentSelection?.current;
    let item = new SelectedItem(position);
    if (currentSingleSelection instanceof SingleSelection &&
        currentSingleSelection.type == ItemType.Grid) {
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
export class SelectionManager {
    afterSelection = null;
    recursions;
    index = 0;
    doOnce;
    current = null;
    results = [];
    constructor(...singleSelections) {
        this.recursions = singleSelections;
        this.doOnce = false;
        this.reset();
    }
    final(afterSelection) {
        this.afterSelection = afterSelection;
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
        console.log("stop: ", this);
        pieces.forEach((p) => (p.selected = false));
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
    constructor(positions, type, description = null, checkCallback = null, nextCallback = null, autoCancel = true) {
        this.positions = positions;
        this.type = type;
        this.description =
            description === null
                ? type === ItemType.Piece
                    ? "请选择一个棋子"
                    : "请选择一个格点"
                : description;
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
//# sourceMappingURL=selection.js.map