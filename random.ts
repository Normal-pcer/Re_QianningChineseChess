let _seed = 0;

const _int32 = (x: number) => x & 0xffffffff;

class RandomGenerator {
    seed: number;
    mt: number[] = [];
    mti: number = 0;

    constructor(seed: number) {
        this.seed = seed;
        this.mt = new Array(624);

        this.mt[0] = seed;
        for (let i = 1; i < 624; i++) {
            this.mt[i] = _int32(1812433253 * (this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)) + i);
        }
    }

    extract() {
        if (this.mti == 0) this.twist();

        let y = this.mt[this.mti];
        y = y ^ (y >>> 11);
        y = y ^ ((y << 7) & 2636928640);
        y = y ^ ((y << 15) & 4022730752);
        y = y ^ (y >>> 18);
        this.mti = (this.mti + 1) % 624;
        return _int32(y);
    }

    random() {
        return this.extract() * 2.3283064365386963e-10 + 0.5;  // 2.328e-10 = 2^(-32)
    }

    twist() {
        for (let i = 0; i < 624; i++) {
            let y = _int32((this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff)) >>> 1;
            this.mt[i] = this.mt[(i + 397) % 624] ^ (y >> 1);

            if (y % 2 != 0) {
                this.mt[i] = this.mt[i] ^ 0x9908b0df;
            }
        }
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
    return defaultGenerator.random();
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
    let rand = new RandomGenerator(fixedSeed).random();
    console.log(data, "->"+rand.toString());
    return rand;
}
