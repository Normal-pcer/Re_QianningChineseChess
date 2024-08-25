import { DamageType } from "./damageType.js";

export class PieceConfig {
    health: number = 0;
    maxHealth: number = 0;
    attackDamage: number = 0;
    defense: number = 0;
    criticalChance: number = 0;
    criticalDamage: number = 0;
    damageType: DamageType = DamageType.None;

    constructor(
        maxHealth: number,
        attackDamage: number,
        defense: number,
        damageType: DamageType = DamageType.MeleeLow,
        criticalChance: number = 0.1,
        criticalDamage: number = 0.75,
    ) {
        this.health = maxHealth;
        this.maxHealth = maxHealth;
        this.attackDamage = attackDamage;
        this.defense = defense;
        this.criticalChance = criticalChance;
        this.criticalDamage = criticalDamage;
        this.damageType = damageType;
    }
}

export const defaultPieceConfigs: { [key: string]: PieceConfig } = {
    master: new PieceConfig(7500, 800, 500, DamageType.MeleeLow),
    guard: new PieceConfig(2500, 1500, 100, DamageType.MeleeLow),
    elephant: new PieceConfig(4000, 2000, 200, DamageType.MeleeMedium),
    horse: new PieceConfig(3000, 2750, 200, DamageType.MeleeMedium),
    chariot: new PieceConfig(4500, 2200, 200, DamageType.MeleeHigh),
    gun: new PieceConfig(5000, 2250, 200, DamageType.Ranged),
};
