import * as round from "./round.js";
export var _schedules = [];
export class Schedule {
    time;
    action;
    constructor(time, action) {
        this.time = time;
        this.action = action;
    }
}
export function schedule(action, time, timeOffset = null) {
    _schedules.push(new Schedule(time + (timeOffset ? timeOffset + round.round : 0), action));
}
export function scheduleTimeout(action, time, timeOffset = -1) {
    schedule(action, time, timeOffset);
}
export function runAllSchedules() {
    // 执行所有计划
    for (const schedule of _schedules) {
        if (schedule.time <= round.round) {
            schedule.action();
            //remove
            _schedules.splice(_schedules.indexOf(schedule), 1);
        }
    }
}
export function setSchedules(schedules) {
    _schedules = schedules;
}
//# sourceMappingURL=schedule.js.map