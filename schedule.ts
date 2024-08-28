import * as round from "./round.js";

const schedules: Schedule[] = [];

class Schedule {
    time: number;
    action: () => void;

    constructor(time: number, action: () => void) {
        this.time = time;
        this.action = action;
    }
}

export function schedule(time: number, action: () => void, add_time = true) {
    schedules.push(new Schedule(time + (add_time ? round.round : 0), action));
}

export function runAllSchedules() {
    // 执行所有计划
    for (const schedule of schedules) {
        if (schedule.time <= round.round) {
            schedule.action();
            //remove
            schedules.splice(schedules.indexOf(schedule), 1);
        }
    }
}
