import { DamageType } from "./damageType.js";

export class PieceConfig {
    health: number = 0;
    maxHealth: number = 0;
    attackDamage: number = 0;
    defense: number = 0;
    criticalChance: number = 0;
    criticalDamage: number = 0;
    damageType: DamageType = DamageType.None;
    weight: number = 0;

    constructor(
        maxHealth: number,
        attackDamage: number,
        defense: number,
        damageType: DamageType = DamageType.MeleeLow,
        weight: number = 0,
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
        this.weight = weight;
    }
}

export const defaultPieceConfigs: { [key: string]: PieceConfig } = {
    master: new PieceConfig(7500, 1700, 500, DamageType.MeleeLow, 12),
    guard: new PieceConfig(2500, 1500, 100, DamageType.MeleeLow, 8),
    elephant: new PieceConfig(3500, 2000, 100, DamageType.MeleeMedium, 18),
    horse: new PieceConfig(3000, 2750, 200, DamageType.MeleeMedium, 15),
    chariot: new PieceConfig(4500, 2200, 200, DamageType.MeleeHigh, 20),
    gun: new PieceConfig(4750, 2250, 150, DamageType.Ranged, 20),
    pawn: new PieceConfig(2250, 1250, 100, DamageType.MeleeLow, 8),
    none: new PieceConfig(1, 0, 0, DamageType.None),
};
