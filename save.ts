import { modifyPieces, Piece, pieces } from "./piece.js";
import { Player } from "./player.js";
import { nextRound, round, setRound } from "./round.js";
import { getPlayerFromTeam, setPlayerFromTeam, Team } from "./team.js";
import { deepCopy, notNull } from "./utils.js";
import { DefaultMovingBehaviors, filterGrids } from "./defaultMovingBehaviors.js";
import { getCallback, getCallbackRegistryKey } from "./callbackRegister.js";

const saves: Save[] = [];

function generateSafeFunction(code: string): Function {
    const bodyStart = code.indexOf("{") + 1;
    const bodyEnd = code.lastIndexOf("}");
    const fnBody = code.slice(bodyStart, bodyEnd);
    const newFnCode = `return function anonymous() { ${fnBody} }`;
    return new Function(newFnCode)();
}

export class Save {
    pieces: Piece[] = [];
    players: { [key: string]: Player } = {};
    round: number = 0;

    constructor(pieces: Piece[], players: { [key: string]: Player }, round: number) {
        this.pieces = deepCopy(pieces);
        this.players = deepCopy(players);
        this.round = round;
    }

    storePrepare() {
        this.pieces.forEach((piece) => {
            piece.htmlElement = null;
        });
    }

    stringify() {
        return JSON.stringify(this, (key, value) => {
            if (typeof value === "function") {
                let registryKey = getCallbackRegistryKey(value);
                if (registryKey) {
                    return "<REGISTERED FUNCTION>" + registryKey;
                }
                return "<STRINGIFIED FUNCTION>" + value.toString();
            }
            return value;
        });
    }
    static parse(str: string) {
        let saveObj = JSON.parse(str, (key, value) => {
            if (typeof value === "string" && value.startsWith("<STRINGIFIED FUNCTION>")) {
                let text = ";return " + value.slice(22);
                return generateSafeFunction(text);
            }
            if (typeof value === "string" && value.startsWith("<REGISTERED FUNCTION>")) {
                let registryKey = value.slice(21);
                if (getCallback(registryKey)) {
                    return getCallback(registryKey);
                }
            }
            return value;
        }) as Object;
        let saveTemplate = deepCopy(saves[saves.length - 1]);

        function deepAssign(target: any, source: any) {
            if (source instanceof Array) {
                for (let index = 0; index < source.length; index++) {
                    if (target[index] === undefined) {
                        target.push({});
                    }
                    deepAssign(target[index], source[index]);
                }
            } else
                for (let key in source) {
                    if (source[key] && typeof source[key] === "object") {
                        if (!target[key]) {
                            target[key] = {};
                        }
                        deepAssign(target[key], source[key]);
                    } else {
                        target[key] = deepCopy(source[key]);
                    }
                }
        }

        deepAssign(saveTemplate, saveObj);

        saveTemplate.pieces.forEach((piece) => {
            piece.init();
        });
        return saveTemplate;
    }
}

export function saveCurrent() {
    saves.push(
        new Save(
            pieces,
            {
                [Team.Red]: getPlayerFromTeam(Team.Red),
                [Team.Black]: getPlayerFromTeam(Team.Black),
            },
            round
        )
    );
}

export function recall() {
    console.log(saves);
    if (saves.length > 1) {
        saves.pop();
        const lastSave = saves.pop();
        if (lastSave) {
            pieces.forEach((piece) => {
                if (piece.clickListener)
                    piece.htmlElement?.removeEventListener("click", piece.clickListener);
            });

            setPlayerFromTeam(Team.Red, lastSave.players[Team.Red]);
            setPlayerFromTeam(Team.Black, lastSave.players[Team.Black]);
            for (let index = 0; index < pieces.length; index++) {
                Object.assign(pieces[index], lastSave.pieces[index]);
                pieces[index].init();
            }
            setRound(lastSave.round);

            nextRound();
        }
    }
}

export function storeSave() {
    localStorage.setItem("save", saves[saves.length - 1].stringify());
}

export function loadSave() {
    console.log("load");
    // Load save from LocalStorage
    const saveStr = localStorage.getItem("save");
    const save = saveStr ? Save.parse(saveStr) : null;
    if (save) {
        saves.push(save);
        saves.push(save); // 不是多打的，别给删了
    }
}
