import {
    ActionCard,
    healthInstantPotionActionCard,
    highGunActionCard,
    limitlessHorseActionCard,
    strengthPotionActionCard,
    weaknessPotionActionCard,
} from "./actionCard.js";
import { Player } from "./player.js";
import { getCurrentTeam, nextRound } from "./round.js";
import { getPlayerFromTeam } from "./team.js";

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
];

function giveCard(card: ActionCard, to: Player) {
    to.actionCards.push(card);
}

export function lootCard() {
    let player = getPlayerFromTeam(getCurrentTeam());
    giveCard(pool[Math.floor(Math.random() * pool.length)].card, player);
    nextRound();
}
