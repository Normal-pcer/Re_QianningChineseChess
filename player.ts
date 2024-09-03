import { ActionCard } from "./actionCard.js";

export class Player {
    actionCards: ActionCard[] = [];
    team: string = "none";

    constructor(team: string) {
        this.team = team;
    }

    showActionCards() {
        let targetUlElement = document.getElementById("action-cards-list") as HTMLUListElement;
        targetUlElement.innerHTML = this.team + ":";

        for (let i = 0; i < this.actionCards.length; i++) {
            let targetLiElement = document.createElement("li");
            targetLiElement.innerHTML = this.actionCards[i].name;
            targetUlElement.appendChild(targetLiElement);

            targetLiElement.addEventListener("click", () => {
                this.actionCards[i].apply();
                this.actionCards.splice(i, 1);
            });
        }
    }
}
