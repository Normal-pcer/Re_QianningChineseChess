import { Position } from "./position.js";
import { Piece, PieceType, pieces } from "./piece.js";
import * as Selection from "./selection.js";
import { DefaultMovingBehaviors, init } from "./defaultMovingBehaviors.js";
import { Team } from "./team.js";
import { nextRound, getRound } from "./round.js";
import { AttributeModifier } from "./attributeProvider.js";
import { highGunActionCard, testActionCard } from "./actionCard.js";
import { runAllSchedules } from "./schedule.js";

init();

export function stop(victor: string) {
    Selection.setCurrentSelection(null);
    let victor_tip_bar = document.querySelector("#victor-tip span");
    if (victor_tip_bar !== null) victor_tip_bar.innerHTML = victor + "赢了";
}

window.onload = () => {
    let container = document.getElementById("game-container");
    if (container !== null) container.style.display = "block";
    putPieces();

    /**
     * @description 主要选择器，在几乎整个游戏周期内使用，用于移动棋子和控制攻击
     */
    /*prettier-ignore */
    const MainSelection = new Selection
        .SelectionManager(
            new Selection.SingleSelection(
                [], Selection.ItemType.Piece, "请选择要移动的棋子", 
                (piece) => getRound() === (piece.data as Piece).team))
        .then(
            (past) => {
                let selectedPiece = past[0].data as Piece;
                let validMove = selectedPiece.destinations;
                let validTarget = selectedPiece.attackTargets;
                return new Selection.SingleSelection(
                    validMove.concat(validTarget),
                    Selection.ItemType.Grid,
                    "请选择要移动到的位置",
                    (selectedGrid) => {
                        let pos = selectedGrid.data as Position
                        if (pos.integerGrid().piece !== null) {
                            return validTarget.some((item)=>item.nearby(pos));
                        } else {
                            return validMove.some((item)=>item.nearby(pos));
                        }
                    }
                )
            }
        )
        .final(
            (results) => {
                let selectedPiece = results[0].data as Piece;
                let selectedTarget = (results[1].data as Position).integerGrid();
                let success = false;

                if (selectedTarget.piece !== null) {
                    success = selectedPiece.attack(selectedTarget.piece);
                    console.log(selectedPiece, "attack", selectedTarget.piece, success);
                } else {
                    success = selectedPiece.move(selectedTarget);
                    console.log(selectedPiece, "move", selectedTarget, success);
                }

                if (success) {
                    nextRound();
                    runAllSchedules();
                    let round = getRound();
                    let round_tip = document.querySelector("#round-tip>span") as HTMLElement
                    round_tip.innerText = round;
                }
            } 
        );
    Selection.setCurrentSelection(MainSelection);

    Position._calculateGameboardSize();

    let gameboard = document.getElementById("gameboard");
    if (gameboard instanceof HTMLElement)
        gameboard.onclick = (event) => {
            // get click pos
            let pos = new Position(event.clientX, event.clientY, false);
            return Selection.onGameboardClick(pos);
        };

    pieces.forEach((piece) => {
        piece.init();
    });

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
                highGunActionCard.apply()
            }
        };
};

// 当页面大小改变
window.onresize = () => {
    Position._calculateGameboardSize();
    pieces.forEach((piece) => {
        piece.draw();
    });
};

/* prettier-ignore */
const putPieces = ()=>{
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
}
