import { Position } from "./position.js";
import { Piece, pieces } from "./piece.js";

const returnSelf = (obj) => obj;

/**
 * @type {SelectionManager?}
 */
var currentSelection = null;

/**
 * @param {Piece} piece
 */
var PieceClickListener = (piece) => {
    let currentSingleSelection = currentSelection.current;
    let item = new SelectedItem(piece);
    if (currentSingleSelection != null && currentSingleSelection.type == ItemType.Piece) {
        console.log(piece) ;
        if (piece.selected) {
            piece.selected = false;
            currentSelection.stop();
        } else if (currentSingleSelection.check(item)) {
            piece.selected = true;
            let r = null;
            if (currentSingleSelection.nextCallback != null)
                r = currentSingleSelection.nextCallback(item);
            currentSelection.next(r);
            return true;
        } else {
            if (currentSingleSelection.autoCancel) currentSelection.stop();
        }
    }
    return false;
};

/**
 * @param {Position} position
 */
var GameboardClickListener = (position) => {
    let currentSingleSelection = currentSelection.current;
    let item = new SelectedItem(position);
    if (currentSingleSelection != null && currentSingleSelection.type == ItemType.Grid) {
        console.log(currentSingleSelection);
        if (currentSingleSelection.check(item)) {
            let r = null;
            if (currentSingleSelection.nextCallback != null)
                r = currentSingleSelection.nextCallback(item);
            currentSelection.next(r);
            return true;
        } else {
            if (currentSingleSelection.autoCancel) currentSelection.stop();
        }
    }
    return false;
};

/**
 * @description: To organize the selection process
 * @property {Array{Function}} recursions - the functions to be called to get the next selection
 * @property {number} index - the index of the current recursion
 * @property {SingleSelection} current - the current recursion
 * @property {Function} afterSelection - action after the selection
 * @property {boolean} once - whether set current selection to null after the selection
 */
export class SelectionManager {
    /**
     *
     * @param  {...SingleSelection} singleSelections
     */
    constructor(afterSelection, ...singleSelections) {
        this.afterSelection = afterSelection;
        this.recursions = singleSelections.map((s) => () => s);
        this.index = 0;
        this.once = false;
        this.current = this.recursions[this.index]();
        this.results = [];
        this.current.tip();
    }

    /**
     * @description A way to recurse a singleSelection into the selectionManager.
     * @param {recursion} recursion
     * @returns {SelectionManager}
     */
    then(recursion) {
        this.recursions.push(recursion);
        return this;
    }

    once(once = true) {
        this.once = once;
        return this;
    }

    reset() {
        this.index = 0;
        this.results = [];
        this.current = this.recursions[this.index]();
        this.current.tip();
    }

    next(result) {
        if (this.index >= this.recursions.length - 1) {
            this.results.push(result);
            this.stop(true);
        } else {
            this.index++;
            this.current = this.recursions[this.index](result);
            this.results.push(result);
            this.current.tip();
        }
    }

    stop(done = false) {
        if (this.afterSelection != null && done) this.afterSelection(this.results);
        this.reset();
        document.querySelector("#action-bar span").innerText = "";
        document.querySelector("#action-bar").style.display = "none";
        if (this.once) currentSelection = null;
        else this.current.tip();
        pieces.forEach((p) => (p.selected = false));
    }
}

/**
 * @description: Describe the type of single-selection item
 */
export class ItemType {
    /**
     * @description: A position at the gameboard grid, no matter it is occupied or not
     */
    static Grid = "grid";
    /**
     * @description: An empty position at the gameboard grid. (No piece)
     * */
    static Piece = "piece";
    /**
     * @description: [PLACEHOLDER] A customized type
     * */
    static Custom = "custom";
}

/**
 * @property {string} type - the type of the item
 * @property {Position|Piece} data - the selected position/piece
 */
export class SelectedItem {
    constructor(data, type = null) {
        if (type != null) this.type = type;
        else {
            if (data instanceof Position) this.type = ItemType.Grid;
            else if (data instanceof Piece) this.type = ItemType.Piece;
            else this.type = ItemType.Custom;
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
    /**
     *
     * @param {Array} positions
     * @param {string} type
     * @param {Function?} checkCallback
     * @param {Function?} nextCallback
     * @param {boolean} autoCancel
     * @param {string?} description
     */
    constructor(
        positions,
        type,
        description = null,
        checkCallback = null,
        nextCallback = null,
        autoCancel = true
    ) {
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

    /**
     *
     * @param {SelectedItem} item
     * @returns
     */
    check(item) {
        if (this.checkCallback != null) {
            return this.checkCallback(item);
        } else {
            return this.positions.some((pos) => pos.nearby(item.position()));
        }
    }

    tip() {
        let element = document.querySelector("#action-bar span");
        element.innerText = this.description;
        element.parentElement.style.display = "block";
    }
}

export class PieceMoveSelection extends SingleSelection {
    /**
     * @param {Piece} piece
     */
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
}

/**
 * @callback recursion
 * @param {SelectedItem} result
 * @returns {SingleSelection}
 */
