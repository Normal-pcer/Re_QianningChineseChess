import {
    ActionCard,
    healthInstantPotionActionCard,
    highGunActionCard,
    limitlessHorseActionCard,
    strengthPotionActionCard,
    strengthPotionEnhancedActionCard,
    strengthPotionExtendedActionCard,
    superLaughingActionCard,
    weaknessPotionActionCard,
} from "./actionCard.js";
import { Player } from "./player.js";
import { getCurrentTeam, nextRound } from "./round.js";
import { getPlayerFromTeam } from "./team.js";
import { deepCopy } from "./utils.js";

class poolItem {
    card: ActionCard;
    weight: number;
    constructor(card: ActionCard, weight: number = 1) {
        this.card = card;
        this.weight = weight;
    }
}

const pool = [
    new poolItem(highGunActionCard),
    new poolItem(limitlessHorseActionCard),
    new poolItem(strengthPotionActionCard),
    new poolItem(weaknessPotionActionCard),
    new poolItem(healthInstantPotionActionCard),
    new poolItem(strengthPotionEnhancedActionCard, 0.5),
    new poolItem(strengthPotionExtendedActionCard, 0.5),
    new poolItem(superLaughingActionCard),
];

function giveCard(card: ActionCard, to: Player) {
    to.actionCards.push(deepCopy(card));
}

export function lootCard() {
    let player = getPlayerFromTeam(getCurrentTeam());
    let weightSum = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * weightSum;
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
