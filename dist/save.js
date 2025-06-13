var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Save_1;
import { pieces } from "./piece.js";
import { newRound, round, setRound } from "./round.js";
import { getPlayerFromTeam, mergePlayerFromTeam, Team } from "./team.js";
import { deepCopy, deepMerge } from "./utils.js";
import { getCallback, getCallbackRegistryKey } from "./callbackRegister.js";
import { TriggerManager } from "./trigger.js";
import { schedules } from "./schedule.js";
import { Serializable, TypeRegistry } from "./serialize.js";
const saves = [];
let Save = Save_1 = class Save extends Serializable {
    pieces = [];
    players = {};
    round = 0;
    triggers = [];
    schedules = [];
    constructor(pieces, players, round, triggers, schedules) {
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
    static parse(str) {
        let obj = JSON.parse(str, (key, value) => {
            if (typeof value === "string") {
                if (value.startsWith("<REGISTERED FUNCTION>")) {
                    let key = value.substring("<REGISTERED FUNCTION>".length);
                    return getCallback(key);
                }
                else if (value.startsWith("<STRINGIFIED FUNCTION>")) {
                    let code = value.substring("<STRINGIFIED FUNCTION>".length);
                    return new Function(code);
                }
            }
        });
        let result = TypeRegistry.revive(obj);
        if (result instanceof Save_1) {
            return result;
        }
        else {
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
};
Save = Save_1 = __decorate([
    TypeRegistry.register(),
    __metadata("design:paramtypes", [Array, Object, Number, Array, Array])
], Save);
export { Save };
/**
 * 保存当前的游戏局面。
 */
export function saveCurrent() {
    let save = new Save(pieces, {
        [Team.Red]: getPlayerFromTeam(Team.Red),
        [Team.Black]: getPlayerFromTeam(Team.Black),
    }, round, TriggerManager.triggers, schedules);
    saves.push(save);
}
/**
 * 回退一次操作
 */
export function recall() {
    if (saves.length === 0)
        return;
    if (round === 0)
        return;
    // 假设当前位于 Round n，玩家尚未操作。
    // 当前的 saves 中，上一个元素应该是 Round n-1，存储着玩家现在看见的局面。
    // 希望玩家位于 Round n-1，看到 Round n-1 开始的局面。
    saves.pop();
    // 现在上一个元素是 Round n-2，存储着 Round n-1 开始的局面。
    if (saves.length === 0)
        throw new Error("无法找到上一个局面");
    let save = saves[saves.length - 1];
    save.round = round - 1; // Round n-1 初始。
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
    if (str === null)
        return;
    let save = Save.parse(str);
    save.apply();
}
//# sourceMappingURL=save.js.map