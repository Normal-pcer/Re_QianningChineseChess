import { healthInstantPotionActionCard, highGunActionCard, limitlessHorseActionCard, strengthPotionActionCard, weaknessPotionActionCard, } from "./actionCard.js";
import { getCurrentTeam, nextRound } from "./round.js";
import { getPlayerFromTeam } from "./team.js";
class poolItem {
    card;
    weight;
    constructor(card, weight = 1) {
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
function giveCard(card, to) {
    to.actionCards.push(card);
}
export function lootCard() {
    let player = getPlayerFromTeam(getCurrentTeam());
    giveCard(pool[Math.floor(Math.random() * pool.length)].card, player);
    nextRound();
}
//# sourceMappingURL=cardLooting.js.map