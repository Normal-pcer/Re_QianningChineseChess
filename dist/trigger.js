export class Trigger {
    action;
    event;
    constructor(action, event) {
        this.action = action;
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
            if (trigger.event == event) {
                console.log(`Trigger: `, trigger);
                trigger.action(...args);
            }
        }
    }
}
export class DamageTrigger extends Trigger {
    static event = "DamageTrigger";
    constructor(action) {
        super(action, "DamageTrigger");
    }
}
//# sourceMappingURL=trigger.js.map