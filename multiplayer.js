import { Position } from "./position.js";
import { Piece, PieceType, Team, pieces } from "./piece.js";
import * as Selection from "./selection.js";
import { DefaultMovingBehaviors, init } from "./defaultMovingBehaviors.js";

var term = 0;
const termMap = [Team.Red, Team.Black];

init();

export function stop(victor) {
    Selection.setCurrentSelection(null);
    document.querySelector("#victor-tip span").innerText = victor + "赢了";
}

window.onload = () => {
    document.getElementById("game-container").style.display = "block";
    putPieces();

    /**
     * @description 主要选择器，在几乎整个游戏周期内使用，用于移动棋子和控制攻击
     */
    let MainSelection = new Selection.SelectionManager((final) => {
        /**
         * @type {Piece}
         */
        let piece = final[0].data;

        /**
         * @type {Position}
         */
        let pos = final[1].data.integerGrid;

        if (pos.piece == null) {
            piece.move(pos);
            term += 1;
        } else if (
            piece.attackTargets.some((element) => {
                return element.equals(pos);
            })
        )
            if (piece.attack(pos.piece)) {
                term += 1;
            }

        document.querySelector("#term-tip span").innerText = termMap[term % 2];
    }, new Selection.SingleSelection([], Selection.ItemType.Piece, "请选择要移动的棋子", (item) => item.data.team === termMap[term % 2])).then(
        (piece) => {
            /**
             * @type {Piece}
             */
            let pieceData = piece.data;
            return new Selection.SingleSelection(
                pieceData.destinations.concat(pieceData.attackTargets),
                Selection.ItemType.Grid,
                "请选择目标"
            );
        }
    );
    Selection.setCurrentSelection(MainSelection);

    Position._calculateGameboardSize();
    document.getElementById("gameboard").onclick = (event) => {
        // get click pos
        let pos = new Position(event.clientX, event.clientY, false);
        return Selection.onGameboardClick(pos);
    };

    pieces.forEach((piece) => {
        piece.init();
    });

    document.getElementById("submit-cheating").onclick = (event) => {
        let text = document.querySelector("#cheating input").value;
        console.log(text);
        if (text == Team.Red || text == Team.Black) {
            pieces.filter((piece)=>piece.type===PieceType.Master && piece.team != text)[0].damaged()
        }
        event.defaultPrevented()
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
