import { Piece, Team, PieceType } from "./piece.js";
import { Position } from "./position.js";
import { Vector2 } from "./vector.js";

const BOARD = [0, 8, 0, 9];
const RED_BASE = [3, 5, 0, 2];
const BLACK_BASE = [3, 5, 8, 10];
const RED_TERRITORY = [0, 8, 0, 4];
const BLACK_TERRITORY = [0, 8, 5, 9];

var mapping = {};
var mappingAttack = {};

export function init() {
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
}

function GridAvailable(pos, config = BOARD) {
    return config[0] <= pos.x && pos.x <= config[1] && config[2] <= pos.y && pos.y <= config[3];
}

/**
 *
 * @param {Function} condition
 * @param {number[]} config
 * @returns {Position[]}
 */
function filterGrids(condition, config = BOARD) {
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
 *
 * @param {Position} origin
 * @param {Vector2} direction
 * @param {number} barriers
 */
function ray(origin, direction, barriers = 0, strict = true) {
    let grids = [];
    let pos = origin.add(direction);
    let barriersCount = 0;
    while (GridAvailable(pos)) {
        if (!strict || barriersCount == barriers) grids.push(pos);
        if (pos.piece != null) {
            barriersCount++;
            if (barriersCount > barriers) {
                break;
            }
        }
        pos = pos.add(direction);
    }
    return grids;
}

export class DefaultMovingBehaviors {
    /**
     * @param {Piece} piece
     * @return {Position[]}
     */
    static master = (piece) => {
        console.log(piece);
        let team = piece.team;
        let config = team === Team.Red ? RED_BASE : BLACK_BASE;
        return filterGrids((pos) => piece.position.manhattanDistance(pos) == 1, config);
    };
    /**
     * @param {Piece} piece
     * @return {Position[]}
     */
    static masterAttack = (piece) => {
        console.log(piece);
        return this.master(piece).concat(
            ray(piece.position, new Vector2(0, 1))
                .concat(ray(piece.position, new Vector2(0, -1)))
                .filter((pos) => pos.piece != null && pos.piece.type === PieceType.Master)
        );
    };

    /**
     * @param {Piece} piece
     * @return {Position[]}
     */
    static guard = (piece) => {
        let team = piece.team;
        let config = team === Team.Red ? RED_BASE : BLACK_BASE;
        return filterGrids(
            (pos) =>
                piece.position.manhattanDistance(pos) == 2 &&
                piece.position.chebyshevDistance(pos) == 1,
            config
        );
    };
    /**
     * @param {Piece} piece
     * @return {Position[]}
     * */
    static elephant = (piece) => {
        let team = piece.team;
        let config = team === Team.Red ? RED_TERRITORY : BLACK_TERRITORY;
        return filterGrids((pos) => {
            if (
                piece.position.manhattanDistance(pos) == 4 &&
                piece.position.chebyshevDistance(pos) == 2
            ) {
                let pointer = Vector2.of(piece.position, pos);
                let check = piece.position.add(pointer.div(2));
                return check.piece === null;
            }
            return false;
        }, config);
    };
    /**
     * @param {Piece} piece
     * @return {Position[]}
     * */
    static horse = (piece) => {
        return filterGrids((pos) => {
            if (
                piece.position.manhattanDistance(pos) != 3 ||
                piece.position.chebyshevDistance(pos) != 2
            )
                return false;
            // With a piece
            let neighbors = filterGrids(
                (pos) => piece.position.manhattanDistance(pos) == 1 && pos.piece !== null
            );
            let pointer = Vector2.of(piece.position, pos);
            return !neighbors.some(
                (neighbor) => pointer.dot(Vector2.of(piece.position, neighbor)) == 2
            );
        });
    };

    /**
     * @param {Piece} piece
     * @return {Position[]}
     * */
    static chariot = (piece) => {
        return ray(piece.position, new Vector2(1, 0)).concat(
            ray(piece.position, new Vector2(-1, 0)),
            ray(piece.position, new Vector2(0, 1)),
            ray(piece.position, new Vector2(0, -1))
        );
    };

    /**
     * @param {Piece} piece
     * @return {Position[]}
     * */
    static gunMove = (piece) => {
        return this.chariot(piece).filter((pos) => pos.piece === null);
    };

    /**
     * @param {Piece} piece
     * @return {Position[]}
     * */
    static gunAttack = (piece) => {
        return ray(piece.position, new Vector2(1, 0), 1).concat(
            ray(piece.position, new Vector2(-1, 0), 1),
            ray(piece.position, new Vector2(0, 1), 1),
            ray(piece.position, new Vector2(0, -1), 1)
        );
    };

    /**
     * @param {Piece} piece
     * @return {Position[]}
     * */
    static pawn = (piece) => {
        let team = piece.team;
        let baseY = team === Team.Red ? 0 : 9;
        let passed = Math.abs(piece.position.y - baseY) > 4;
        let directions = [team === Team.Red ? new Vector2(0, 1) : new Vector2(0, -1)];
        if (passed) directions.push(...[new Vector2(1, 0), new Vector2(-1, 0)]);
        return filterGrids((pos) => {
            return directions.some(
                (direction) => Vector2.of(piece.position, pos).dot(direction) == 1
            );
        });
    };

    /**
     * @param {Piece} piece
     * @returns {Position[]}
     */
    static auto(piece, attack = false) {
        return attack ? mappingAttack[piece.type](piece) : mapping[piece.type](piece);
    }
}
