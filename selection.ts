import { Position } from "./position.js";
import { Piece, pieces } from "./piece.js";
import { getCurrentTeam, nextRound } from "./round.js";
import { showPiece, showDefaultPiece } from "./pieceFrame.js";
import { runAllSchedules } from "./schedule.js";

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
    oncancelCallback: ((results: SelectedItem[]) => void | any) | null = null;
    recursions: (((past: SelectedItem[]) => SingleSelection) | SingleSelection)[];
    index: number = 0;
    doOnce: boolean;
    current: SingleSelection | null = null;
    results: SelectedItem[] = [];
    replaceWithFinally_: SelectionManager | null = null;

    constructor(...singleSelections: SingleSelection[]) {
        this.recursions = singleSelections;
        this.doOnce = true;
        this.reset();
    }

    final(afterSelection: (results: SelectedItem[]) => void | any) {
        this.afterSelection = afterSelection;
        return this;
    }

    oncancel(oncancel: (results: SelectedItem[]) => void | any) {
        this.oncancelCallback = oncancel;
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

    cycle() {
        return this.once(false);
    }

    replaceWithFinally(manager: SelectionManager | null) {
        this.replaceWithFinally_ = manager;
        return this;
    }

    reset() {
        this.index = 0;
        this.results = [];
        let first = this.recursions[this.index];
        this.current = first instanceof SingleSelection ? first : first([]);
        // this.current.tip();
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
        // 删除现有的提示
        let action_bar = document.querySelector("#action-bar");
        if (action_bar instanceof HTMLElement) action_bar.style.display = "none";
        let action_bar_span = document.querySelector("#action-bar span");
        if (action_bar_span instanceof HTMLElement) action_bar_span.innerText = "";

        let results = this.results;
        this.reset();
        if (this.doOnce) currentSelection = null;
        else this.current?.tip();
        if (this.afterSelection != null && done) this.afterSelection(results);
        if (this.oncancelCallback != null && !done) this.oncancelCallback(results);
        console.log("stop: ", this);

        pieces.forEach((p) => (p.selected = false));

        if (this.replaceWithFinally_ != null) {
            this.replaceWithFinally_.reset();
            setCurrentSelection(this.replaceWithFinally_);
        }
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
export const MainSelection = new SelectionManager(
    new SingleSelection(
        [],
        ItemType.Piece,
        "请选择要移动的棋子",
        (piece) => true
    )
)
    .then((past) => {
        let selectedPiece = past[0].data as Piece;
        if (getCurrentTeam() !== selectedPiece.team) {
            showPiece(selectedPiece);
            return new SingleSelection(
                [],
                ItemType.Grid,
                "查看棋子信息",
                (grid) => false
            );
        }
        let validMove = selectedPiece.destinations;
        let validTarget = selectedPiece.attackTargets;
        showPiece(selectedPiece);
        return new SingleSelection(
            validMove.concat(validTarget),
            ItemType.Grid,
            "请选择要移动到的位置",
            (selectedGrid) => {
                let pos = selectedGrid.data as Position;
                if (pos.integerGrid().owner !== null) {
                    return validTarget.some((item) => item.nearby(pos));
                } else {
                    return validMove.some((item) => item.nearby(pos));
                }
            }
        );
    })
    .final((results) => {
        let selectedPiece = results[0].data as Piece;
        let selectedTarget = (results[1].data as Position).integerGrid();
        let success = false;

        if (selectedTarget.owner !== null) {
            success = selectedPiece.attack(selectedTarget.owner);
            console.log(selectedPiece, "attack", selectedTarget.owner, success);
        } else {
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
