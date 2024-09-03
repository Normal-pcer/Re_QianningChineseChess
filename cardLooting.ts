import { ActionCard, highGunActionCard, limitlessHorseActionCard } from "./actionCard.js";
import { Player } from "./player.js";
import { getCurrentTeam } from "./round.js";
import { getPlayerFromTeam } from "./team.js";

const pool = [highGunActionCard, limitlessHorseActionCard];

function giveCard(card: ActionCard, to: Player) {
    to.actionCards.push(card);
}

export function lootCard() {
    let player = getPlayerFromTeam(getCurrentTeam());
    giveCard(pool[Math.floor(Math.random() * pool.length)], player);
}
