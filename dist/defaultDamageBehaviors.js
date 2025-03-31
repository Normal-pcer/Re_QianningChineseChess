import { DamageType } from "./damageType.js";
import { Vector2 } from "./vector.js";
import { Position } from "./position.js";
import { fixedRandom } from "./random.js";
import { getCurrentTeam, round } from "./round.js";
export const defaultQuasiMoveTargets = {
    [DamageType.None]: (piece, target) => {
        return piece.position;
    },
    [DamageType.Magic]: (piece, target) => {
        return piece.position;
    },
    [DamageType.MeleeLow]: (piece, target) => {
        return piece.position;
    },
    [DamageType.MeleeMedium]: (piece, target) => {
        let pointer = Vector2.point(piece.position, target.position);
        let steps = piece.position.chebyshevDistance(target.position);
        let step = pointer.div(steps);
        let position = target.position;
        /*prettier-ignore*/
        while (steps-- > 0) {
            let integer_position = position.integerGrid(-0.05, -0.05, true);
            if (integer_position.owner === null)
                return integer_position;
            position = Position.of(Vector2.of(position).sub(step));
        }
        return piece.position;
    },
    [DamageType.MeleeHigh]: (piece, target) => {
        return defaultQuasiMoveTargets[DamageType.MeleeMedium](piece, target);
    },
    [DamageType.Ranged]: (piece, target) => {
        return piece.position;
    },
};
const positionAvailable = (position) => {
    return (0 <= position.x &&
        position.x < 9 &&
        0 <= position.y &&
        position.y < 10 &&
        position.owner === null);
};
function repelForward(origin, direction, distance_limit = 1) {
    let direction_step = direction;
    direction_step = Vector2.of(Position.of(direction_step.div(Math.max(Math.abs(direction_step.x), Math.abs(direction_step.y)))).integerGrid(-0.05, -0.05, true));
    let position = origin;
    while (positionAvailable(position.add(direction_step)) && distance_limit-- > 0) {
        position = position.add(direction_step);
    }
    return positionAvailable(position) ? position : origin;
}
/**
 * @param weight 不低于1000的weight会被视为无穷大
 */
function correctDistanceByWeight(distance, weight) {
    const infinityWeight = 1000; // 高于这个值的weight会被视为无穷大
    const constanceK = 90; // 可以适当调整；constanceK越小越不容易被击退
    let reduceProbability = 1 - Math.pow(constanceK / (constanceK + weight), 2);
    if (weight >= infinityWeight) {
        reduceProbability = 1;
    }
    console.log("reduceProbability: " + reduceProbability);
    let result = 0;
    for (let i = 1; i <= distance; i++) {
        if (fixedRandom(`correctDistanceByWeight round ${round} team ${getCurrentTeam()}`) > reduceProbability) {
            result++;
        }
    }
    return result;
}
export const defaultRepelTargets = {
    [DamageType.None]: (piece, target) => {
        return piece.position;
    },
    [DamageType.Magic]: (piece, target) => {
        return piece.position;
    },
    [DamageType.MeleeLow]: (piece, target) => {
        return piece.position;
    },
    [DamageType.MeleeMedium]: (piece, target) => {
        return repelForward(target.position, Vector2.point(piece.position, target.position), correctDistanceByWeight(1, target.weight.result));
    },
    [DamageType.MeleeHigh]: (piece, target) => {
        return repelForward(target.position, Vector2.point(piece.position, target.position), correctDistanceByWeight(2, target.weight.result));
    },
    [DamageType.Ranged]: (piece, target) => {
        return defaultRepelTargets[DamageType.MeleeMedium](piece, target);
    },
};
//# sourceMappingURL=defaultDamageBehaviors.js.map