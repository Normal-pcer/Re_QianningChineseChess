export class Player {
    actionCards = [];
    team = "none";
    constructor(team) {
        this.team = team;
    }
    /**
     * 展示当前玩家的行为卡
     * @param usable 本轮是否可以使用展示的行为卡
     * @returns
     */
    showActionCards(usable = true) {
        let targetUlElement = document.getElementById(this.team + "-action-cards-list");
        if (!targetUlElement)
            return;
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
            if (usable) {
                targetLiElement.addEventListener("click", () => {
                    this.actionCards[i].apply();
                    this.actionCards.splice(i, 1);
                    this.showActionCards();
                });
            }
            const singleOffsetX = 15; // 单个卡牌的横向偏移量，单位：1%
            // 添加一定的偏移
            let offsetX = i * singleOffsetX; // 横向偏移量的绝对值
            // let targetDivElement = targetLiElement.getElementsByTagName('div')[0];
            targetLiElement.style.left = offsetX + "%";
            // 点击后向上位移或移回原位
            targetLiElement.addEventListener("click", () => {
                // 使用元素的 selected 属性标记是否不在原位
                let selected = targetLiElement.getAttribute("selected") === "true"; // 为 false 或不存在，说明处于原位
                if (selected) {
                    targetLiElement.style.transform = `translateY(64%)`; // 归位
                    targetLiElement.setAttribute("selected", "false");
                }
                else {
                    targetLiElement.style.transform = `translateY(0)`; // 选中
                    targetLiElement.setAttribute("selected", "true");
                }
            });
        }
    }
}
//# sourceMappingURL=player.js.map