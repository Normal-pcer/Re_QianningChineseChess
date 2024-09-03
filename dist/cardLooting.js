import { highGunActionCard, limitlessHorseActionCard } from "./actionCard.js";
import { getCurrentTeam } from "./round.js";
import { getPlayerFromTeam } from "./team.js";
const pool = [highGunActionCard, limitlessHorseActionCard];
function giveCard(card, to) {
    to.actionCards.push(card);
}
export function lootCard() {
    let player = getPlayerFromTeam(getCurrentTeam());
    giveCard(pool[Math.floor(Math.random() * pool.length)], player);
}
//# sourceMappingURL=cardLooting.js.map