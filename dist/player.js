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
            targetLiElement.innerHTML =
                `<div class="action-card-frame">
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
        }
    }
}
//# sourceMappingURL=player.js.map