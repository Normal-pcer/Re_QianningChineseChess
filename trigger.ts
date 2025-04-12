import { Damage } from "./damage.js";
import { Serializable } from "./serialize.js";

export abstract class Trigger extends Serializable {
    public event: string;
    abstract action(...args: any[]): void;

    constructor(event: string) {
        super();
        this.event = event;
    }
}

export class TriggerManager {
    static triggers: Trigger[] = [];
    static addTrigger(trigger: Trigger) {
        this.triggers.push(trigger);
    }
    static trigger(event: string, ...args: any[]) {
        for (let trigger of this.triggers) {
            if (trigger.event === event) {
                console.log(`Trigger: `, trigger);
                trigger.action(...args);
            }
        }
    }
    static setTriggers(triggers: Trigger[]) {
        this.triggers = triggers;
    }
}

export abstract class DamageTrigger extends Trigger {
    public static event: string = "DamageTrigger";
    constructor() {
        super("DamageTrigger");
    }
}

