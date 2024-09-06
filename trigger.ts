import { Damage } from "./damage.js";

export class Trigger {
    action: Function;
    event: string;
    constructor(action: Function, event: string) {
        this.action = action;
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
            if (trigger.event == event) {
                console.log(`Trigger: `, trigger);
                trigger.action(...args);
            }
        }
    }
    static setTriggers(triggers: Trigger[]) {
        this.triggers = triggers;
    }
}

export class DamageTrigger extends Trigger {
    static event = "DamageTrigger";
    constructor(action: (damage: Damage) => void) {
        super(action, "DamageTrigger");
    }
}