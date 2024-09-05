import { Position } from "./position.js";
import { Piece, PieceType, pieces } from "./piece.js";
import * as Selection from "./selection.js";
import { init } from "./defaultMovingBehaviors.js";
import { getPlayerFromTeam, Team } from "./team.js";
import { nextRound, getCurrentTeam } from "./round.js";
import { AttributeModifier } from "./attributeProvider.js";
import { highGunActionCard, limitlessHorseActionCard } from "./actionCard.js";
import { runAllSchedules } from "./schedule.js";
import { lootCard } from "./cardLooting.js";
import { loadSave, recall, saveCurrent, storeSave } from "./save.js";
import { registerCallback } from "./callbackRegister.js";
import { showDefaultPiece, showPiece } from "./pieceFrame.js";
init();
export function stop(victor) {
    Selection.setCurrentSelection(null);
    let victor_tip_bar = document.querySelector("#victor-tip span");
    if (victor_tip_bar !== null)
        victor_tip_bar.innerHTML = victor + "赢了";
}
window.onload = () => {
    // deepCopy([1, 2, 3]);
    let container = document.getElementById("game-container");
    if (container !== null)
        container.style.display = "block";
    putPieces();
    /**
     * @description 主要选择器，在几乎整个游戏周期内使用，用于移动棋子和控制攻击
     */
    /*prettier-ignore */
    const MainSelection = new Selection
        .SelectionManager(new Selection.SingleSelection([], Selection.ItemType.Piece, "请选择要移动的棋子", (piece) => getCurrentTeam() === piece.data.team))
        .then((past) => {
        let selectedPiece = past[0].data;
        let validMove = selectedPiece.destinations;
        let validTarget = selectedPiece.attackTargets;
        showPiece(selectedPiece);
        return new Selection.SingleSelection(validMove.concat(validTarget), Selection.ItemType.Grid, "请选择要移动到的位置", (selectedGrid) => {
            let pos = selectedGrid.data;
            if (pos.integerGrid().piece !== null) {
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
        if (selectedTarget.piece !== null) {
            success = selectedPiece.attack(selectedTarget.piece);
            console.log(selectedPiece, "attack", selectedTarget.piece, success);
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
    });
    Selection.setCurrentSelection(MainSelection);
    Position._calculateGameboardSize();
    let gameboard = document.getElementById("gameboard");
    if (gameboard instanceof HTMLElement)
        gameboard.onclick = (event) => {
            let pos = new Position(event.clientX, event.clientY, false);
            return Selection.onGameboardClick(pos);
        };
    pieces.forEach((piece) => {
        piece.init();
    });
    registerCallback(pieces[0].attackActionCallback.result, "defaultAttackActionCallback");
    let submit_cheating = document.getElementById("submit-cheating");
    if (submit_cheating instanceof HTMLElement)
        submit_cheating.onclick = (event) => {
            let input = document.querySelector("#cheating input");
            let text = input instanceof HTMLInputElement ? input.value : "0";
            if (text == Team.Red || text == Team.Black) {
                pieces
                    .filter((piece) => piece.type === PieceType.Master && piece.team != text)[0]
                    .damaged();
            }
            if (text === "/high") {
                highGunActionCard.apply();
            }
            if (text === "/limitlessHorse") {
                limitlessHorseActionCard.apply();
            }
            if (text === "/recall") {
                recall();
            }
            if (text === "/store") {
                storeSave();
            }
            if (text === "/load") {
                loadSave();
            }
        };
    // 开局三回合攻击无效，避免开局打马
    pieces.forEach((piece) => {
        piece.defense.area(0).modify(new AttributeModifier(11000, 3 * 2));
    });
    document.getElementById("loot-card-button").onclick = () => {
        lootCard();
        getPlayerFromTeam(getCurrentTeam()).showActionCards();
    };
    document.getElementById("recall-button").onclick = () => {
        recall();
        console.log("recall");
    };
    document.getElementById("store-button").onclick = () => {
        storeSave();
        document.getElementById("store-button").style.color = "gray";
        setTimeout(() => {
            document.getElementById("store-button").style.color = "black";
        }, 1000);
    };
    document.getElementById("load-button").onclick = () => {
        loadSave();
        document.getElementById("load-button").style.color = "gray";
        setTimeout(() => {
            document.getElementById("load-button").style.color = "black";
        }, 1000);
    };
    saveCurrent();
    showDefaultPiece();
};
// 当页面大小改变
window.onresize = () => {
    Position._calculateGameboardSize();
    pieces.forEach((piece) => {
        piece.draw();
    });
};
/* prettier-ignore */
const putPieces = () => {
    pieces.push(new Piece(Team.Red, PieceType.Master, new Position(4, 0, true), document.getElementById("red-master1")));
    pieces.push(new Piece(Team.Red, PieceType.Guard, new Position(3, 0, true), document.getElementById("red-guard1")));
    pieces.push(new Piece(Team.Red, PieceType.Guard, new Position(5, 0, true), document.getElementById("red-guard2")));
    pieces.push(new Piece(Team.Red, PieceType.Elephant, new Position(2, 0, true), document.getElementById("red-elephant1")));
    pieces.push(new Piece(Team.Red, PieceType.Elephant, new Position(6, 0, true), document.getElementById("red-elephant2")));
    pieces.push(new Piece(Team.Red, PieceType.Horse, new Position(1, 0, true), document.getElementById("red-horse1")));
    pieces.push(new Piece(Team.Red, PieceType.Horse, new Position(7, 0, true), document.getElementById("red-horse2")));
    pieces.push(new Piece(Team.Red, PieceType.Chariot, new Position(0, 0, true), document.getElementById("red-chariot1")));
    pieces.push(new Piece(Team.Red, PieceType.Chariot, new Position(8, 0, true), document.getElementById("red-chariot2")));
    pieces.push(new Piece(Team.Red, PieceType.Gun, new Position(1, 2, true), document.getElementById("red-gun1")));
    pieces.push(new Piece(Team.Red, PieceType.Gun, new Position(7, 2, true), document.getElementById("red-gun2")));
    pieces.push(new Piece(Team.Red, PieceType.Pawn, new Position(0, 3, true), document.getElementById("red-pawn1")));
    pieces.push(new Piece(Team.Red, PieceType.Pawn, new Position(2, 3, true), document.getElementById("red-pawn2")));
    pieces.push(new Piece(Team.Red, PieceType.Pawn, new Position(4, 3, true), document.getElementById("red-pawn3")));
    pieces.push(new Piece(Team.Red, PieceType.Pawn, new Position(6, 3, true), document.getElementById("red-pawn4")));
    pieces.push(new Piece(Team.Red, PieceType.Pawn, new Position(8, 3, true), document.getElementById("red-pawn5")));
    pieces.push(new Piece(Team.Black, PieceType.Master, new Position(4, 9, true), document.getElementById("black-master1")));
    pieces.push(new Piece(Team.Black, PieceType.Guard, new Position(3, 9, true), document.getElementById("black-guard1")));
    pieces.push(new Piece(Team.Black, PieceType.Guard, new Position(5, 9, true), document.getElementById("black-guard2")));
    pieces.push(new Piece(Team.Black, PieceType.Elephant, new Position(2, 9, true), document.getElementById("black-elephant1")));
    pieces.push(new Piece(Team.Black, PieceType.Elephant, new Position(6, 9, true), document.getElementById("black-elephant2")));
    pieces.push(new Piece(Team.Black, PieceType.Horse, new Position(1, 9, true), document.getElementById("black-horse1")));
    pieces.push(new Piece(Team.Black, PieceType.Horse, new Position(7, 9, true), document.getElementById("black-horse2")));
    pieces.push(new Piece(Team.Black, PieceType.Chariot, new Position(0, 9, true), document.getElementById("black-chariot1")));
    pieces.push(new Piece(Team.Black, PieceType.Chariot, new Position(8, 9, true), document.getElementById("black-chariot2")));
    pieces.push(new Piece(Team.Black, PieceType.Gun, new Position(1, 7, true), document.getElementById("black-gun1")));
    pieces.push(new Piece(Team.Black, PieceType.Gun, new Position(7, 7, true), document.getElementById("black-gun2")));
    pieces.push(new Piece(Team.Black, PieceType.Pawn, new Position(0, 6, true), document.getElementById("black-pawn1")));
    pieces.push(new Piece(Team.Black, PieceType.Pawn, new Position(2, 6, true), document.getElementById("black-pawn2")));
    pieces.push(new Piece(Team.Black, PieceType.Pawn, new Position(4, 6, true), document.getElementById("black-pawn3")));
    pieces.push(new Piece(Team.Black, PieceType.Pawn, new Position(6, 6, true), document.getElementById("black-pawn4")));
    pieces.push(new Piece(Team.Black, PieceType.Pawn, new Position(8, 6, true), document.getElementById("black-pawn5")));
};
//# sourceMappingURL=multiplayer.js.map