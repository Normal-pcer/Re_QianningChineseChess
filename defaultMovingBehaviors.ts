import { Piece, PieceType } from "./piece.js";
import { Team } from "./team.js";
import { Position } from "./position.js";
import { Vector2 } from "./vector.js";
import { registerCallback } from "./callbackRegister.js";

const BOARD = [0, 8, 0, 9];
const RED_BASE = [3, 5, 0, 2];
const BLACK_BASE = [3, 5, 7, 9];
const RED_TERRITORY = [0, 8, 0, 4];
const BLACK_TERRITORY = [0, 8, 5, 9];

var mapping: { [key: string]: (piece: Piece) => Position[] } = {};
var mappingAttack: { [key: string]: (piece: Piece) => Position[] } = {};

export function initDefaultMovingBehaviors() {
    mapping = {
        [PieceType.Guard]: DefaultMovingBehaviors.guard,
        [PieceType.Elephant]: DefaultMovingBehaviors.elephant,
        [PieceType.Horse]: DefaultMovingBehaviors.horse,
        [PieceType.Chariot]: DefaultMovingBehaviors.chariot,
        [PieceType.Gun]: DefaultMovingBehaviors.gunMove,
        [PieceType.Pawn]: DefaultMovingBehaviors.pawn,
        [PieceType.Master]: DefaultMovingBehaviors.master,
    };

    mappingAttack = {
        [PieceType.Gun]: DefaultMovingBehaviors.gunAttack,
        [PieceType.Master]: DefaultMovingBehaviors.masterAttack,
        [PieceType.Chariot]: DefaultMovingBehaviors.chariot,
        [PieceType.Horse]: DefaultMovingBehaviors.horse,
        [PieceType.Elephant]: DefaultMovingBehaviors.elephant,
        [PieceType.Guard]: DefaultMovingBehaviors.guard,
        [PieceType.Pawn]: DefaultMovingBehaviors.pawn,
    };

    // 注册所有函数
    for (let key in mapping) {
        registerCallback(mapping[key]);
    }
    for (let key in mappingAttack) {
        registerCallback(mappingAttack[key]);
    }
    registerCallback(DefaultMovingBehaviors.auto, "auto");
}

function GridAvailable(pos: Position, config = BOARD) {
    return config[0] <= pos.x && pos.x <= config[1] && config[2] <= pos.y && pos.y <= config[3];
}

export function filterGrids(condition: (pos: Position) => boolean, config = BOARD) {
    let grids = [];
    for (let i = config[0]; i <= config[1]; i++) {
        for (let j = config[2]; j <= config[3]; j++) {
            let pos = new Position(i, j, true);
            if (condition(pos)) {
                grids.push(pos);
            }
        }
    }
    return grids;
}

/**
 * @param barriers_min 默认值-1表示限制为和barriers_max相同
 * @returns
 */
export function ray(origin: Position, direction: Vector2, barriers_max = 0, barriers_min = -1) {
    let grids = [];
    let pos = origin.add(direction);
    let barriersCount = 0;
    if (barriers_min == -1) barriers_min = barriers_max;
    while (GridAvailable(pos)) {
        if (barriersCount >= barriers_min && barriersCount <= barriers_max) grids.push(pos);
        if (pos.owner != null) {
            barriersCount++;
            if (barriersCount > barriers_max) {
                break;
            }
        }
        pos = pos.add(direction);
    }
    return grids;
}

export class DefaultMovingBehaviors {
    static master = (piece: Piece) => {
        const RED_ORIGIN = new Position(4, 0, true);
        const BLACK_ORIGIN = new Position(4, 9, true);
        console.log(piece);
        let team = piece.team;
        let config = team === Team.Red ? RED_BASE : BLACK_BASE;
        let origin = team === Team.Red ? RED_ORIGIN : BLACK_ORIGIN;
        if (
            piece.position.x >= config[0] &&
            piece.position.x <= config[1] &&
            piece.position.y >= config[2] &&
            piece.position.y <= config[3]
        ) {
            // 位于九宫格
            return filterGrids((pos) => piece.position.manhattanDistance(pos) == 1, config);
        } else
            return filterGrids(
                (pos) =>
                    piece.position.manhattanDistance(origin) > pos.manhattanDistance(origin) &&
                    piece.position.manhattanDistance(pos) == 1,
                BOARD
            ); // 被击出九宫格，可以向靠近九宫格的方向移动
    };

    static masterAttack = (piece: Piece) => {
        console.log(piece);
        return DefaultMovingBehaviors.master(piece).concat(
            ray(piece.position, new Vector2(0, 1))
                .concat(ray(piece.position, new Vector2(0, -1)))
                .filter((pos) => pos.owner != null && pos.owner.type === PieceType.Master)
        );
    };

    static guard = (piece: Piece) => {
        let team = piece.team;
        let config = team === Team.Red ? RED_BASE : BLACK_BASE;
        return filterGrids(
            (pos) =>
                piece.position.manhattanDistance(pos) == 2 &&
                piece.position.chebyshevDistance(pos) == 1,
            config
        );
    };

    static elephant = (piece: Piece) => {
        let team = piece.team;
        let config = team === Team.Red ? RED_TERRITORY : BLACK_TERRITORY;
        return filterGrids((pos) => {
            if (
                piece.position.manhattanDistance(pos) == 4 &&
                piece.position.chebyshevDistance(pos) == 2
            ) {
                let pointer = Vector2.point(piece.position, pos);
                let check = piece.position.add(pointer.div(2));
                return check.owner === null;
            }
            return false;
        }, config);
    };

    static horse = (piece: Piece) => {
        return filterGrids((pos) => {
            if (
                piece.position.manhattanDistance(pos) != 3 ||
                piece.position.chebyshevDistance(pos) != 2
            )
                return false;
            let neighbors = filterGrids(
                (pos) => piece.position.manhattanDistance(pos) == 1 && pos.owner !== null
            );
            let pointer = Vector2.point(piece.position, pos);
            return !neighbors.some(
                (neighbor) => pointer.dot(Vector2.point(piece.position, neighbor)) == 2
            );
        });
    };

    static chariot = (piece: Piece) => {
        return ray(piece.position, new Vector2(1, 0)).concat(
            ray(piece.position, new Vector2(-1, 0)),
            ray(piece.position, new Vector2(0, 1)),
            ray(piece.position, new Vector2(0, -1))
        );
    };

    static gunMove = (piece: Piece) => {
        return DefaultMovingBehaviors.chariot(piece).filter((pos) => pos.owner === null);
    };

    static gunAttack = (piece: Piece) => {
        return ray(piece.position, new Vector2(1, 0), 1).concat(
            ray(piece.position, new Vector2(-1, 0), 1),
            ray(piece.position, new Vector2(0, 1), 1),
            ray(piece.position, new Vector2(0, -1), 1)
        );
    };

    static pawn = (piece: Piece) => {
        let team = piece.team;
        let baseY = team === Team.Red ? 0 : 9;
        let passed = Math.abs(piece.position.y - baseY) > 4;
        let directions = [team === Team.Red ? new Vector2(0, 1) : new Vector2(0, -1)];
        if (passed) directions.push(...[new Vector2(1, 0), new Vector2(-1, 0)]);
        return filterGrids((pos) => {
            return directions.some((direction) =>
                Vector2.point(piece.position, pos).equals(direction)
            );
        });
    };

    static auto(piece: Piece, attack = false) {
        return attack ? mappingAttack[piece.type] : mapping[piece.type];
    }
}
