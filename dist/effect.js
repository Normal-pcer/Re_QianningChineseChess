import { getAttributeModifierById } from "./attributeProvider.js";
import { round } from "./round.js";
const ROMAN_NUMBER_LIMIT = 25; // 小于等于此数值的等级将使用罗马数字表示
const toRomanNumber = (number) => {
    const HARD_LIMIT = 3999;
    if (number > ROMAN_NUMBER_LIMIT || number > HARD_LIMIT) {
        return number.toString();
    }
    const ones = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    const tens = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];
    const hundreds = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"];
    const thousands = ["", "M", "MM", "MMM"];
    return (thousands[Math.floor(number / 1000)] +
        hundreds[Math.floor((number % 1000) / 100)] +
        tens[Math.floor((number % 100) / 10)] +
        ones[Math.floor(number % 10)]);
};
export class StatusEffect {
    name = "";
    id = "";
    description = "";
    relatedModifierIds = [];
    _expire = Infinity;
    enabled = true;
    continuedAction = null;
    negative = false;
    level = null;
    showLevel = true;
    /**
     * @param expire -当为null时，取决于所有relatedModifiers的expire中最早的
     * @param expireOffset -当为数字时，表示参数expire的偏移量，此时实际过期时间为当前时间之后再经过
     * ($expire-$expireOffset)回合；当为null时，表示参数expire直接作为过期回合号
     * @param level -当为null时，表示该效果不应用等级机制；否则表示该效果的等级
     */
    constructor(name, id, description = "", relatedModifiers = [], level = null, expire = null, expireOffset = -1) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.relatedModifierIds = relatedModifiers.map((modifier) => modifier.id);
        if (expire === null) {
            let minExpire = Infinity;
            this.relatedModifiers.forEach((modifier) => {
                if (modifier.expire < minExpire)
                    minExpire = modifier.expire;
            });
            this.expire = minExpire;
            this.relatedModifiers.forEach((modifier) => {
                modifier.expire = this.expire;
            });
        }
        else {
            if (expireOffset === null)
                this.expire = expire;
            else
                this.expire = round + expire + expireOffset;
        }
        this.level = level;
        if (this.expire !== Infinity) {
            this.relatedModifiers.forEach((modifier) => {
                modifier.expire = this.expire;
            });
        }
    }
    hideLevel() {
        this.showLevel = false;
        return this;
    }
    get expire() {
        return this._expire;
    }
    set expire(value) {
        this._expire = value;
        this.relatedModifiers.forEach((modifier) => {
            modifier.expire = value;
        });
    }
    get displayName() {
        if (!this.level || !this.showLevel)
            return this.name;
        let roman = toRomanNumber(this.level);
        return this.name + roman;
    }
    setAsNegative() {
        this.negative = true;
        return this;
    }
    get relatedModifiers() {
        return this.relatedModifierIds.map((id) => getAttributeModifierById(id));
    }
    runContinuedAction() {
        if (this.continuedAction !== null && this.available)
            this.continuedAction();
    }
    setContinuedAction(action) {
        this.continuedAction = action;
    }
    get available() {
        return this.enabled && round <= this.expire;
    }
}
//# sourceMappingURL=effect.js.map