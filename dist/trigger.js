import { Serializable } from "./serialize.js";
export class Trigger extends Serializable {
    event;
    constructor(event) {
        super();
        this.event = event;
    }
}
export class TriggerManager {
    static triggers = [];
    static addTrigger(trigger) {
        this.triggers.push(trigger);
    }
    static trigger(event, ...args) {
        for (let trigger of this.triggers) {
            if (trigger.event === event) {
                console.log(`Trigger: `, trigger);
                trigger.action(...args);
            }
        }
    }
    static setTriggers(triggers) {
        this.triggers = triggers;
    }
}
export class DamageTrigger extends Trigger {
    static event = "DamageTrigger";
    constructor() {
        super("DamageTrigger");
    }
}
//# sourceMappingURL=trigger.js.map