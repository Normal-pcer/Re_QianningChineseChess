import { HighGunActionCard, LimitlessHorseActionCard, RegenerationPotionActionCard, StrengthPotionActionCard, WeaknessPotionActionCard, InstantHealthPotionActionCard, StrengthPotionEnhancedActionCard, StrengthPotionExtendedActionCard, SuperLaughingActionCard, WithBellAndTripodActionCard, DeterminedResistanceActionCard, AreaGunActionCard, PotionPotionActionCard, PotionPotionEnhancedActionCard, } from "./actionCard.js";
import { fixedRandom } from "./random.js";
import { getCurrentTeam, nextRound, round } from "./round.js";
import { getCurrentSelection, MainSelection } from "./selection.js";
import { getPlayerFromTeam } from "./team.js";
import { deepCopy } from "./utils.js";
const playerCardCountMax = 7;
class poolItem {
    card;
    weight;
    constructor(card, weight = 1) {
        this.card = card;
        this.weight = weight;
    }
}
let pool = [
    new poolItem(new HighGunActionCard()),
    new poolItem(new LimitlessHorseActionCard()),
    new poolItem(new StrengthPotionActionCard()),
    new poolItem(new WeaknessPotionActionCard()),
    new poolItem(new InstantHealthPotionActionCard()),
    new poolItem(new RegenerationPotionActionCard()),
    new poolItem(new StrengthPotionEnhancedActionCard(), 0.5),
    new poolItem(new StrengthPotionExtendedActionCard(), 0.5),
    new poolItem(new SuperLaughingActionCard(), 0.5),
    new poolItem(new WithBellAndTripodActionCard()),
    new poolItem(new DeterminedResistanceActionCard()),
    new poolItem(new AreaGunActionCard()),
    new poolItem(new PotionPotionActionCard()),
    new poolItem(new PotionPotionEnhancedActionCard(), 0.5),
];
export function initCardLooting() {
}
function giveCard(card, to) {
    to.actionCards.push(deepCopy(card));
    to.showActionCards();
}
export function lootCard() {
    // 取消当前选择
    if (MainSelection !== getCurrentSelection()) {
        getCurrentSelection()?.stop();
    }
    let player = getPlayerFromTeam(getCurrentTeam());
    if (player.actionCards.length >= playerCardCountMax)
        return;
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
export function returnCardById(cardId) {
    let player = getPlayerFromTeam(getCurrentTeam());
    pool.forEach((item) => {
        if (item.card.id === cardId) {
            giveCard(item.card, player);
        }
    });
}
//# sourceMappingURL=cardLooting.js.map