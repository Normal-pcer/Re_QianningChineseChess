let _seed = 0;
class RandomGenerator {
    seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}
let defaultGenerator: RandomGenerator = new RandomGenerator(_seed);

export function seed(value: number | null = null) {
    if (value === null) {
        value = Date.now();
    }
    _seed = value;
    defaultGenerator = new RandomGenerator(_seed);
}

export function random() {
    return defaultGenerator.next();
}

export function randomInt(min: number, max: number) {
    return Math.floor(random() * (max - min + 1)) + min;
}

export function fixedRandom(...data: (string | number)[]) {
    const toNumber = (s: string | number) => {
        if (typeof s === "number") return s;
        let result = 0;
        for (let i = 0; i < s.length; i++) {
            result += s.charCodeAt(i);
        }
        return result;
    };
    let fixedSeed = _seed + data.map(toNumber).reduce((a, b) => a + b);
    return new RandomGenerator(fixedSeed).next();
}
