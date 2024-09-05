export class Player {
    actionCards = [];
    team = "none";
    constructor(team) {
        this.team = team;
    }
    showActionCards() {
        let targetUlElement = document.getElementById(this.team + "-action-cards-list");
        if (!targetUlElement)
            return;
        targetUlElement.innerHTML = "";
        for (let i = 0; i < this.actionCards.length; i++) {
            let targetLiElement = document.createElement("li");
            targetLiElement.innerHTML =
                this.actionCards[i].name +
                    ` <span style="color: gray;">(${this.actionCards[i].description})</span>`;
            targetUlElement.appendChild(targetLiElement);
            targetLiElement.addEventListener("click", () => {
                this.actionCards[i].apply();
                this.actionCards.splice(i, 1);
                this.showActionCards();
            });
        }
    }
}
//# sourceMappingURL=player.js.map