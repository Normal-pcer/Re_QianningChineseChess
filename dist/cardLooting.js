import { healthInstantPotionActionCard, highGunActionCard, limitlessHorseActionCard, strengthPotionActionCard, strengthPotionEnhancedActionCard, strengthPotionExtendedActionCard, superLaughingActionCard, weaknessPotionActionCard, withBellAndTripodActionCard, } from "./actionCard.js";
import { getCurrentTeam, nextRound } from "./round.js";
import { getPlayerFromTeam } from "./team.js";
import { deepCopy } from "./utils.js";
const playerCardCountMax = 5;
class poolItem {
    card;
    weight;
    constructor(card, weight = 1) {
        this.card = card;
        this.weight = weight;
    }
}
let pool = [];
export function initCardLooting() {
    pool.push(new poolItem(highGunActionCard), new poolItem(limitlessHorseActionCard), new poolItem(strengthPotionActionCard), new poolItem(weaknessPotionActionCard), new poolItem(healthInstantPotionActionCard), new poolItem(strengthPotionEnhancedActionCard, 0.5), new poolItem(strengthPotionExtendedActionCard, 0.5), new poolItem(superLaughingActionCard), new poolItem(withBellAndTripodActionCard));
}
function giveCard(card, to) {
    to.actionCards.push(deepCopy(card));
    to.showActionCards();
}
export function lootCard() {
    let player = getPlayerFromTeam(getCurrentTeam());
    if (player.actionCards.length >= playerCardCountMax)
        return;
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
export function returnCardById(cardId) {
    let player = getPlayerFromTeam(getCurrentTeam());
    pool.forEach((item) => {
        if (item.card.id === cardId) {
            giveCard(item.card, player);
        }
    });
}
//# sourceMappingURL=cardLooting.js.map