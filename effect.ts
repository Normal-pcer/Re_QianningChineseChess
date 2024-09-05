import { AttributeModifier, getAttributeModifierById } from "./attributeProvider.js";
import { round } from "./round.js";

export class Effect {
    name: string = "";
    id: string = "";
    description: string = "";
    relatedModifierIds: number[] = [];
    expire: number = -1;
    enabled: boolean = true;
    continuedAction: (() => void) | null = null;

    /**
     * @param expire -当为null时，取决于所有relatedModifiers的expire中最早的
     * @param expireOffset -当为数字时，表示参数expire的偏移量，此时实际过期时间为当前时间之后再经过
     * ($expire-$expireOffset)回合；当为null时，表示参数expire直接作为过期回合号
     */
    constructor(
        name: string,
        id: string,
        description: string = "",
        relatedModifiers: AttributeModifier<any>[] = [],
        expire: number | null = null,
        expireOffset: number | null = -1
    ) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.relatedModifierIds = relatedModifiers.map((modifier) => modifier.id);
        if (expire === null) {
            let minExpire = Infinity;
            this.relatedModifiers.forEach((modifier) => {
                if (modifier.expire < minExpire && modifier.expire !== -1)
                    minExpire = modifier.expire;
            });
            this.expire = minExpire == Infinity ? -1 : minExpire;
        } else {
            if (expireOffset === null) this.expire = expire;
            else this.expire = expire === -1 ? -1 : round + expire + expireOffset;
        }

        if (this.expire !== -1) {
            this.relatedModifiers.forEach((modifier) => {
                modifier.expire = this.expire;
            });
        }
    }

    get relatedModifiers() {
        return this.relatedModifierIds.map((id) => getAttributeModifierById(id));
    }

    runContinuedAction() {
        if (this.continuedAction !== null && this.available) this.continuedAction();
    }

    setContinuedAction(action: () => void) {
        this.continuedAction = action;
    }

    get available() {
        return this.enabled && (this.expire === -1 || round <= this.expire);
    }
}
