import { modifyPieces, Piece, pieces } from "./piece.js";
import { Player } from "./player.js";
import { newRound, nextRound, round, setRound } from "./round.js";
import { getPlayerFromTeam, mergePlayerFromTeam, Team } from "./team.js";
import { deepCopy, deepMerge, notNull } from "./utils.js";
import { DefaultMovingBehaviors, filterGrids } from "./defaultMovingBehaviors.js";
import { getCallback, getCallbackRegistryKey } from "./callbackRegister.js";
import { Trigger, TriggerManager } from "./trigger.js";
import { schedules, Schedule } from "./schedule.js";
import { StatusEffect } from "./effect.js";
import { Serializable, TypeRegistry } from "./serialize.js";

const saves: Save[] = [];

@TypeRegistry.register()
export class Save extends Serializable {
    pieces: Piece[] = [];
    players: { [key: string]: Player } = {};
    round: number = 0;
    triggers: Trigger[] = [];
    schedules: Schedule[] = [];

    constructor(
        pieces: Piece[],
        players: { [key: string]: Player },
        round: number,
        triggers: Trigger[],
        schedules: Schedule[]
    ) {
        super();
        this.pieces = deepCopy(pieces);
        this.players = deepCopy(players);
        this.round = round;
        this.triggers = deepCopy(triggers);
        this.schedules = deepCopy(schedules);
    }

    /**
     * 将存档转换为 JSON 字符串。
     * 这个过程可以通过 parse 方法无损复原。
     */
    stringify() {
        let str = JSON.stringify(this, (key, value) => {
            if (value instanceof Serializable) {
                return value.serialize();
            }
            if (typeof value === "function") {
                let registryKey = getCallbackRegistryKey(value);
                if (registryKey) {
                    return "<REGISTERED FUNCTION>" + registryKey;
                }
                console.warn("未注册的函数：" + value.name);
                return "<STRINGIFIED FUNCTION>" + value.toString();
            }
            return value;
        });
        return str;
    }

    /**
     * 将 JSON 字符串转换为存档。
     *
     * @param str JSON 字符串
     */
    static parse(str: string) {
        let obj = JSON.parse(str, (key, value) => {
            if (typeof value === "string") {
                if (value.startsWith("<REGISTERED FUNCTION>")) {
                    let key = value.substring("<REGISTERED FUNCTION>".length);
                    return getCallback(key);
                } else if (value.startsWith("<STRINGIFIED FUNCTION>")) { 
                    let code = value.substring("<STRINGIFIED FUNCTION>".length);
                    return new Function(code);
                }
            }
        });
        let result = TypeRegistry.revive(obj);

        if (result instanceof Save) {
            return result;
        } else {
            throw new Error("Cannot load save.");
        }
    }

    /**
     * 将存档应用到当前游戏局面
     */
    apply() {
        mergePlayerFromTeam(Team.Black, this.players[Team.Black]);
        mergePlayerFromTeam(Team.Red, this.players[Team.Red]);
        deepMerge(pieces, this.pieces, true);
        setRound(this.round);
        newRound(); // 刷新显示
    }
}

/**
 * 保存当前的游戏局面。
 */
export function saveCurrent() {
    let save = new Save(
        pieces,
        {
            [Team.Red]: getPlayerFromTeam(Team.Red),
            [Team.Black]: getPlayerFromTeam(Team.Black),
        },
        round,
        TriggerManager.triggers,
        schedules
    );
    saves.push(save);
}

/**
 * 回退一次操作
 */
export function recall() {
    if (saves.length === 0) return;
    if (round === 0) return;
    // 假设当前位于 Round n，玩家尚未操作。
    // 当前的 saves 中，上一个元素应该是 Round n-1，存储着玩家现在看见的局面。
    // 希望玩家位于 Round n-1，看到 Round n-1 开始的局面。
    saves.pop();
    // 现在上一个元素是 Round n-2，存储着 Round n-1 开始的局面。
    if (saves.length === 0) throw new Error("无法找到上一个局面");
    let save = saves[saves.length - 1];
    save.round = round - 1;  // Round n-1 初始。
    save.apply();
}

/**
 * 把当前状态存储到 LocalStorage 中
 */
export function storeSave() {
    console.log("storeSave");
    let save = saves[saves.length - 1];
    localStorage.setItem("save", save.stringify());
    console.log("str: ", localStorage.getItem("save"));
}

export function loadSave() {
    let str = localStorage.getItem("save");
    if (str === null) return;
    let save = Save.parse(str);
    save.apply();
}
