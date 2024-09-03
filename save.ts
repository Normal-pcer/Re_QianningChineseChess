import { modifyPieces, Piece, pieces } from "./piece.js";
import { Player } from "./player.js";
import { nextRound, round } from "./round.js";
import { getPlayerFromTeam, setPlayerFromTeam, Team } from "./team.js";

const saves: Save[] = [];

export class Save {
    pieces: Piece[] = [];
    players: { [key: string]: Player } = {};
    round: number = 0;

    constructor(pieces: Piece[], players: { [key: string]: Player }, round: number) {
        // deep copy
        this.pieces = deepCopy(pieces);
        this.players = deepCopy(players);
        this.round = round;
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
    if (saves.length > 0) {
        saves.pop();
        const lastSave = saves[saves.length - 1];
        if (lastSave) {
            pieces.forEach((piece) => {
                if (piece.clickListener)
                    piece.htmlElement?.removeEventListener("click", piece.clickListener);
            });

            setPlayerFromTeam(Team.Red, lastSave.players[Team.Red]);
            setPlayerFromTeam(Team.Black, lastSave.players[Team.Black]);
            nextRound();

            for (let index = 0; index < pieces.length; index++) {
                Object.assign(pieces[index], lastSave.pieces[index]);
                pieces[index].init();
            }
        }
    }
}

export function deepCopy<T>(target: T): T {
    const map = new WeakMap();
    const stack = new Set<unknown>();

    function isObject(obj: unknown): obj is object {
        return typeof obj === "object" && obj !== null;
    }

    function cloneData(data: unknown): unknown {
        if (!isObject(data)) return data;
        if (data instanceof Date) return new Date(data);
        if (data instanceof RegExp) return new RegExp(data.source, data.flags);
        if (typeof data === "function") return generateSafeFunction(data);

        if (stack.has(data)) {
            throw new Error("Cannot clone object with circular reference");
        }
        stack.add(data);

        const exist = map.get(data);
        if (exist) return exist;
        // if (data instanceof HTMLElement) return data.cloneNode(true);
        if (data instanceof HTMLElement) return data;
        if (data instanceof Map) {
            const result = new Map();
            map.set(data, result);
            data.forEach((value, key) => {
                result.set(key, cloneData(value));
            });
            return result;
        }

        if (data instanceof Set) {
            const result = new Set();
            map.set(data, result);
            data.forEach((value) => {
                result.add(cloneData(value));
            });
            return result;
        }

        const keys = Reflect.ownKeys(data);
        const allDesc = Object.getOwnPropertyDescriptors(data);
        const result = Object.create(Object.getPrototypeOf(data), allDesc);
        map.set(data, result);

        keys.forEach((key: PropertyKey) => {
            const value = data[key as keyof typeof data];
            result[key] = isObject(value) ? cloneData(value) : value;
        });

        stack.delete(data);
        return result;
    }

    function generateSafeFunction(fn: Function): Function {
        const code = fn.toString();
        const bodyStart = code.indexOf("{") + 1;
        const bodyEnd = code.lastIndexOf("}");
        const fnBody = code.slice(bodyStart, bodyEnd);
        const newFnCode = `return function ${fn.name ?? "anonymous"}() { ${fnBody} }`;
        return new Function(newFnCode)();
    }

    return cloneData(target) as T;
}
