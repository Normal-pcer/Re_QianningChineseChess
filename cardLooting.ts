import { ActionCard, HighGunActionCard, TestActionCard } from "./actionCard.js";
import { Player } from "./player.js";
import { fixedRandom } from "./random.js";
import { getCurrentTeam, nextRound, round } from "./round.js";
import { getPlayerFromTeam } from "./team.js";
import { deepCopy } from "./utils.js";

const playerCardCountMax = 7;

class poolItem {
    card: ActionCard;
    weight: number;
    constructor(card: ActionCard, weight: number = 1) {
        this.card = card;
        this.weight = weight;
    }
}

let pool: poolItem[] = [];

export function initCardLooting() {
    pool.push(
        new poolItem(new TestActionCard()),
        new poolItem(new HighGunActionCard()),
    );
}

function giveCard(card: ActionCard, to: Player) {
    to.actionCards.push(deepCopy(card));
    to.showActionCards();
}

export function lootCard() {
    let player = getPlayerFromTeam(getCurrentTeam());
    if (player.actionCards.length >= playerCardCountMax) return;
    let weightSum = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = fixedRandom("cardLooting", round) * weightSum;
    let sum = 0;
    for (let item of pool) {
        sum += item.weight;
        if (random < sum) {
            giveCard(item.card, player);
            break;
        }
    }
    nextRound();
}

export function returnCardById(cardId: string) {
    let player = getPlayerFromTeam(getCurrentTeam());
    pool.forEach((item) => {
        if (item.card.id === cardId) {
            giveCard(item.card, player);
        }
    });
}
