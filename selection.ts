import { Position } from "./position.js";
import { Piece, pieces } from "./piece.js";

const returnSelf = (obj: any) => obj;

var currentSelection: SelectionManager | null = null;

var PieceClickListener = (piece: Piece) => {
    let currentSingleSelection = currentSelection?.current;
    let item = new SelectedItem(piece);
    if (
        currentSingleSelection instanceof SingleSelection &&
        currentSingleSelection.type == ItemType.Piece
    ) {
        if (piece.selected) {
            piece.selected = false;
            currentSelection?.stop();
        } else if (currentSingleSelection.check(item)) {
            piece.selected = true;
            let r = null;
            if (currentSingleSelection.nextCallback != null)
                r = currentSingleSelection.nextCallback(item);
            currentSelection?.next(r);
            return true;
        } else {
            if (currentSingleSelection.autoCancel) currentSelection?.stop();
        }
    }
    return false;
};

var GameboardClickListener = (position: Position) => {
    let currentSingleSelection = currentSelection?.current;
    let item = new SelectedItem(position);
    if (
        currentSingleSelection instanceof SingleSelection &&
        currentSingleSelection.type == ItemType.Grid
    ) {
        if (currentSingleSelection.check(item)) {
            let r = null;
            if (currentSingleSelection.nextCallback != null)
                r = currentSingleSelection.nextCallback(item);
            currentSelection?.next(r);
            return true;
        } else {
            if (currentSingleSelection.autoCancel) currentSelection?.stop();
        }
    }
    return false;
};

export class SelectionManager {
    afterSelection: ((results: SelectedItem[]) => void | any) | null = null;
    recursions: (((past: SelectedItem[]) => SingleSelection) | SingleSelection)[];
    index: number = 0;
    doOnce: boolean;
    current: SingleSelection | null = null;
    results: SelectedItem[] = [];

    constructor(
        ...singleSelections: SingleSelection[]
    ) {
        this.recursions = singleSelections;
        this.doOnce = false;
        this.reset();
    }

    final(afterSelection: (results: SelectedItem[]) => void | any) {
        this.afterSelection = afterSelection;
        return this;
    }

    then(recursion: ((past: SelectedItem[]) => SingleSelection) | SingleSelection) {
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
        this.current.tip();
    }

    next(result: SelectedItem) {
        this.results.push(result);
        if (this.index >= this.recursions.length - 1) {
            this.stop(true);
        } else {
            this.index++;
            let future = this.recursions[this.index];
            this.current = future instanceof SingleSelection ? future : future(this.results);
            this.current.tip();
        }
    }

    stop(done = false) {
        if (this.afterSelection != null && done) this.afterSelection(this.results);
        this.reset();

        let action_bar = document.querySelector("#action-bar");
        if (action_bar instanceof HTMLElement) action_bar.style.display = "none";
        let action_bar_span = document.querySelector("#action-bar span");
        if (action_bar_span instanceof HTMLElement) action_bar_span.innerText = "";

        if (this.doOnce) currentSelection = null;
        else this.current?.tip();
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
    data: Position | Piece;
    type: string;

    constructor(data: Position | Piece, type = null) {
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
    positions: Position[];
    type: string;
    description: string;
    checkCallback: ((item: SelectedItem) => boolean) | null;
    autoCancel: boolean;
    nextCallback: Function | null;

    constructor(
        positions: Position[],
        type: string,
        description: string | null = null,
        checkCallback: ((item: SelectedItem) => boolean) | null = null,
        nextCallback: Function | null = null,
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

    check(item: SelectedItem) {
        if (this.checkCallback != null) {
            return this.checkCallback(item);
        } else {
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
    constructor(piece: Piece) {
        super(piece.destinations, ItemType.Piece);
    }
}

export function setPieceClickListener(listener: (piece: Piece) => boolean) {
    PieceClickListener = listener;
}

export function setGameboardClickListener(listener: (pos: Position) => boolean) {
    GameboardClickListener = listener;
}

export function onPieceClick(piece: Piece) {
    if (PieceClickListener != null) {
        return PieceClickListener(piece);
    }
    return false;
}

export function onGameboardClick(pos: Position) {
    if (GameboardClickListener != null) {
        return GameboardClickListener(pos);
    }
    return false;
}

export function setCurrentSelection(selection: SelectionManager | null) {
    currentSelection = selection;
}
