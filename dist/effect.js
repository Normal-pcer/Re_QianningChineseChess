import { round } from "./round.js";
export class Effect {
    name = "";
    id = "";
    description = "";
    relatedModifiers = [];
    expire = -1;
    enabled = true;
    continuedAction = null;
    /**
     * @param expire -当为null时，取决于所有relatedModifiers的expire中最早的
     * @param expireOffset -当为数字时，表示参数expire的偏移量，此时实际过期时间为当前时间之后再经过
     * ($expire-$expireOffset)回合；当为null时，表示参数expire直接作为过期回合号
     */
    constructor(name, id, description = "", relatedModifiers = [], expire = null, expireOffset = -1) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.relatedModifiers = relatedModifiers;
        if (expire === null) {
            let minExpire = Infinity;
            this.relatedModifiers.forEach((modifier) => {
                if (modifier.expire < minExpire && modifier.expire !== -1)
                    minExpire = modifier.expire;
            });
            this.expire = minExpire == Infinity ? -1 : minExpire;
        }
        else {
            if (expireOffset === null)
                this.expire = expire;
            else
                this.expire = expire === -1 ? -1 : round + expire + expireOffset;
        }
        if (this.expire !== -1) {
            this.relatedModifiers.forEach((modifier) => {
                modifier.expire = this.expire;
            });
        }
    }
    runContinuedAction() {
        if (this.continuedAction !== null && this.available)
            this.continuedAction();
    }
    setContinuedAction(action) {
        this.continuedAction = action;
    }
    get available() {
        return this.enabled && (this.expire === -1 || round <= this.expire);
    }
}
//# sourceMappingURL=effect.js.map