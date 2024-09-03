export class Player {
    actionCards = [];
    team = "none";
    constructor(team) {
        this.team = team;
    }
    showActionCards() {
        let targetUlElement = document.getElementById("action-cards-list");
        targetUlElement.innerHTML = this.team + ":";
        for (let i = 0; i < this.actionCards.length; i++) {
            let targetLiElement = document.createElement("li");
            targetLiElement.innerHTML = this.actionCards[i].name;
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