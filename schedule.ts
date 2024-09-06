import * as round from "./round.js";

export var _schedules: Schedule[] = [];

export class Schedule {
    time: number;
    action: () => void;

    constructor(time: number, action: () => void) {
        this.time = time;
        this.action = action;
    }
}

export function schedule(action: () => void, time: number, timeOffset: number | null = null) {
    _schedules.push(new Schedule(time + (timeOffset ? timeOffset + round.round : 0), action));
}

export function scheduleTimeout(action: () => void, time: number, timeOffset: number | null = -1) {
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

export function setSchedules(schedules: Schedule[]) {
    _schedules = schedules;
}
