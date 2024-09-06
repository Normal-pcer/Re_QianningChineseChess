import { ActionCard } from "./actionCard.js";
import { getCurrentTeam } from "./round.js";

export class Player {
    actionCards: ActionCard[] = [];
    team: string = "none";

    constructor(team: string) {
        this.team = team;
    }

    showActionCards(usable: boolean = true) {
        let targetUlElement = document.getElementById(this.team + "-action-cards-list");
        if (!targetUlElement) return;
        targetUlElement.innerHTML = "";

        for (let i = 0; i < this.actionCards.length; i++) {
            let targetLiElement = document.createElement("li");
            targetLiElement.innerHTML =
                this.actionCards[i].name +
                ` <span class="description-text">(${this.actionCards[i].description})</span>`;
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
