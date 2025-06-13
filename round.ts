import { pieces } from "./piece.js";
import { showDefaultPiece } from "./pieceFrame.js";
import { saveCurrent } from "./save.js";
import { runAllSchedules } from "./schedule.js";
import { getPlayerFromTeam, Team } from "./team.js";

export let round = 0;
export const roundMap = [Team.Red, Team.Black];

export function nextRound() {
    saveCurrent();
    round++;
    newRound();
}

/**
 * 新的一轮次开始时，执行部分初始操作
 */
export function newRound() {
    console.log(`Round ${round}`);

    runAllSchedules();
    // 展示技能卡
    getPlayerFromTeam(getCurrentTeam()).showActionCards();
    getPlayerFromTeam(Team.enemy(getCurrentTeam())).showActionCards(false);

    // 轮次提示
    let round_tip = document.querySelector("#round-tip > span") as HTMLElement;
    round_tip.innerText = getCurrentTeam();

    // 展示默认棋子
    showDefaultPiece();

    pieces.forEach((p) => {
        // 执行状态效果持续动作
        p.statusEffects.forEach((eff) => {
            eff.runContinuedAction(p);
        });

        // 重绘棋子
        p.draw();
    });
}

export function getCurrentTeam() {
    return roundMap[round % 2];
}

export function setRound(r: number) {
    round = r;
}
