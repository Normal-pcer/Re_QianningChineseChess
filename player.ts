import { ActionCard } from "./actionCard.js";
import { getCurrentTeam } from "./round.js";

export class Player {
    actionCards: ActionCard[] = [];
    team: string = "none";

    constructor(team: string) {
        this.team = team;
    }

    /**
     * 展示当前玩家的行为卡
     * @param usable 本轮是否可以使用展示的行为卡
     * @returns
     */
    showActionCards(usable: boolean = true) {
        let targetUlElement = document.getElementById(this.team + "-action-cards-list");
        if (!targetUlElement) return;
        targetUlElement.innerHTML = "";

        /*
        一个行为卡的 HTML 大致如下
        <div class="action-card-frame">
            <div class="action-card-title">名称</div>
            <div class="action-card-description">描述</div>
            <div class="action-card-footer">持续 ? 回合</div>
        </div>
        */

        for (let i = 0; i < this.actionCards.length; i++) {
            let targetLiElement = document.createElement("li");
            targetLiElement.innerHTML = `<div class="action-card-frame">
<div class="action-card-title">${this.actionCards[i].name}</div>
<div class="action-card-description">${this.actionCards[i].description}</div>
</div>`;
            targetUlElement.appendChild(targetLiElement);

            const singleOffsetX = 15; // 单个卡牌的横向偏移量，单位：1%

            // 添加一定的偏移
            let offsetX = i * singleOffsetX; // 横向偏移量的绝对值
            targetLiElement.style.left = offsetX + "%";

            // 点击后向上位移或移回原位；特别地，对于可用卡牌，选中后再次点击则会使用。
            // 当选中了一个卡牌，则会复原当前所有的已选中卡牌
            targetLiElement.addEventListener("click", () => {
                const reset = (element: HTMLLIElement) => {
                    element.style.transform = `translateY(64%)`;
                    element.setAttribute("selected", "false");
                }
                // 使用元素的 selected 属性标记是否不在原位
                let selected = targetLiElement.getAttribute("selected") === "true"; // 为 false 或不存在，说明处于原位
                if (selected) {
                    if (usable) {
                        this.actionCards[i].apply();
                        this.actionCards.splice(i, 1);
                        this.showActionCards();
                    }
                    reset(targetLiElement);
                } else {
                    // 复原无关卡牌
                    document.querySelectorAll(".action-cards-list li").forEach((element) => {
                        if (element.getAttribute("selected") === "true") {
                            reset(element as HTMLLIElement);
                        }
                    })
                    targetLiElement.style.transform = `translateY(20%)`; // 选中
                    targetLiElement.setAttribute("selected", "true");
                }
            });
        }
    }
}
