import { Position } from "./position.js";
import { Piece, PieceType, pieces } from "./piece.js";
import * as Selection from "./selection.js";
import { initDefaultMovingBehaviors } from "./defaultMovingBehaviors.js";
import { getPlayerFromTeam, Team } from "./team.js";
import { getCurrentTeam } from "./round.js";
import { AttributeModifier } from "./attributeProvider.js";
import { highGunActionCard, limitlessHorseActionCard } from "./actionCard.js";
import { initCardLooting, lootCard } from "./cardLooting.js";
import { loadSave, recall, saveCurrent, storeSave } from "./save.js";
import { registerCallback } from "./callbackRegister.js";
import { showDefaultPiece } from "./pieceFrame.js";
import { StatusEffect } from "./effect.js";
import { DamageTrigger, TriggerManager } from "./trigger.js";
import { random, seed } from "./random.js";

// 初始化模块
seed();
initDefaultMovingBehaviors();
initCardLooting();

/**
 * 游戏结束,并显示胜利者
 */
export function stop(victor: string) {
    Selection.setCurrentSelection(null);
    let victor_tip_bar = document.querySelector("#victor-tip span");
    if (victor_tip_bar !== null) victor_tip_bar.innerHTML = victor + "赢了";
}

window.onload = () => {
    // 显示游戏界面
    let container = document.getElementById("game-container");
    if (container !== null) container.style.display = "block";
    putPieces(); // 放置棋子

    Selection.setCurrentSelection(Selection.MainSelection);

    Position._calculateGameboardSize();

    // 注册棋盘点击事件
    let gameboard = document.getElementById("gameboard");
    if (gameboard instanceof HTMLElement)
        gameboard.onclick = (event) => {
            let pos = new Position(event.clientX, event.clientY, false);
            return Selection.onGameboardClick(pos);
        };

    // 初始化棋子
    pieces.forEach((piece) => {
        piece.init();
    });
    registerCallback(pieces[0].attackActionCallbackProvider.result, "defaultAttackActionCallback");

    TriggerManager.addTrigger(
        // 注册触发器，用于触发御守三晖状态效果
        new DamageTrigger((damage) => {
            // 如果「将」被攻击
            if (damage.target?.type === PieceType.Master) {
                /**
                 * x从0到3141.5，防御力增量从0到300%；x足够大时，防御力增量固定为300%。
                 * 前半段曲线为余弦函数，后半段曲线为直线。
                 */
                const defenseImproveCalculation = (x: number) => {
                    return x >= 1000 * Math.PI ? 3 : -1.5 * Math.cos(x / 1000) + 1.5;
                };
                // x从0到3000，防御力增量次数从0到3；x足够大时，防御力增量次数固定为3。
                const defenseLastCalculation = (x: number) => {
                    return x >= 3000 ? 3 : Math.ceil(x / 1000);
                };

                let defense = defenseImproveCalculation(damage.amount);
                let last = defenseLastCalculation(damage.amount);
                console.log("defense: ", defense);

                if (last === 0) return; // 伤害过低（<0.5）无需触发御守三晖
                damage.target.pushEffects(
                    new StatusEffect(
                        "御守三晖",
                        "masterSelfDefense",
                        `防御力提升${Math.round(defense * 100)}%`,
                        [
                            damage.target.defense
                                .area(1)
                                .modify(new AttributeModifier(defense, last)),
                        ],
                        Math.round(defense)
                    ).hideLevel()
                );
            }
        })
    );
    // 作弊框相关内容
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
    // 注册初始之护状态效果，用于防止开局打马
    // 对于所有棋子，提升11000点防御力，持续3回合
    let newDefenseModifiers: AttributeModifier<number>[] = [];
    pieces.forEach((piece) => {
        newDefenseModifiers.push(new AttributeModifier(11000, 3 * 2));
        piece.defense.area(0).modify(newDefenseModifiers[newDefenseModifiers.length - 1]);
    });
    pieces.forEach((piece) => {
        piece.pushEffects(
            new StatusEffect(
                "初始之护",
                "initialProtection",
                "提升11000点防御力",
                newDefenseModifiers
            )
        );
    });
    // 注册按钮的点击事件
    (document.getElementById("loot-card-button") as HTMLElement).onclick = () => {
        lootCard();
        getPlayerFromTeam(getCurrentTeam()).showActionCards();
    };
    (document.getElementById("recall-button") as HTMLElement).onclick = () => {
        recall();
        console.log("recall");
    };
    (document.getElementById("store-button") as HTMLElement).onclick = () => {
        storeSave();
        (document.getElementById("store-button") as HTMLElement).style.color = "gray";
        setTimeout(() => {
            (document.getElementById("store-button") as HTMLElement).style.color = "black";
        }, 1000);
    };
    (document.getElementById("load-button") as HTMLElement).onclick = () => {
        loadSave();
        (document.getElementById("load-button") as HTMLElement).style.color = "gray";
        setTimeout(() => {
            (document.getElementById("load-button") as HTMLElement).style.color = "black";
        }, 1000);
    };
    (document.getElementById("action-bar") as HTMLElement).onclick = (event) => {
        Selection.cancelCurrentSelection();
    };
    // 第零轮开始
    saveCurrent();
    showDefaultPiece();
};

// 当页面大小改变
window.onresize = () => {
    Position._calculateGameboardSize(); // 重新计算棋盘大小
    pieces.forEach((piece) => {
        piece.draw(); // 重新绘制棋子，移动到正确的位置
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
