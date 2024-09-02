import { DamageType } from "./damageType.js";
export class PieceConfig {
    health = 0;
    maxHealth = 0;
    attackDamage = 0;
    defense = 0;
    criticalChance = 0;
    criticalDamage = 0;
    damageType = DamageType.None;
    weight = 0;
    constructor(maxHealth, attackDamage, defense, damageType = DamageType.MeleeLow, weight = 0, criticalChance = 0.1, criticalDamage = 0.75) {
        this.health = maxHealth;
        this.maxHealth = maxHealth;
        this.attackDamage = attackDamage;
        this.defense = defense;
        this.criticalChance = criticalChance;
        this.criticalDamage = criticalDamage;
        this.damageType = damageType;
        this.weight = weight;
    }
}
export const defaultPieceConfigs = {
    master: new PieceConfig(7500, 800, 500, DamageType.MeleeLow, 12),
    guard: new PieceConfig(2500, 1500, 100, DamageType.MeleeLow, 8),
    elephant: new PieceConfig(3500, 2000, 100, DamageType.MeleeMedium, 18),
    horse: new PieceConfig(3000, 2750, 200, DamageType.MeleeMedium, 15),
    chariot: new PieceConfig(4500, 2200, 200, DamageType.MeleeHigh, 20),
    gun: new PieceConfig(5000, 2250, 200, DamageType.Ranged, 20),
    pawn: new PieceConfig(2250, 1250, 100, DamageType.MeleeLow, 8),
    none: new PieceConfig(1, 0, 0, DamageType.None),
};
//# sourceMappingURL=defaultPieceConfig.js.map