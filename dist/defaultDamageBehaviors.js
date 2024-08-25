import { DamageType } from "./damageType.js";
import { Vector2 } from "./vector.js";
import { Position } from "./position.js";
export const defaultQuasiMoveTargets = {
    [DamageType.None]: (piece, target) => {
        return piece.position;
    },
    [DamageType.MeleeLow]: (piece, target) => {
        return piece.position;
    },
    [DamageType.MeleeMedium]: (piece, target) => {
        let pointer = Vector2.point(piece.position, target.position);
        let steps = piece.position.chebyshevDistance(target.position);
        let step = pointer.div(steps);
        let position = piece.position;
        /*prettier-ignore*/
        while (steps-- > 0) {
            let integer_position = position.integerGrid(-0.05);
            if (integer_position.piece === null)
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
function repelForward(origin, direction, distance_limit = 1) {
    let direction_step = Vector2.of(Position.of(direction).integerGrid(-0.05));
    let position = origin;
    while (position.add(direction_step).piece === null && distance_limit-- > 0) {
        position = position.add(direction_step);
    }
    return position;
}
export const defaultRepelTargets = {
    [DamageType.None]: (piece, target) => {
        return piece.position;
    },
    [DamageType.MeleeLow]: (piece, target) => {
        return piece.position;
    },
    [DamageType.MeleeMedium]: (piece, target) => {
        return repelForward(piece.position, Vector2.point(piece.position, target.position));
    },
    [DamageType.MeleeHigh]: (piece, target) => {
        return repelForward(piece.position, Vector2.point(piece.position, target.position), 2);
    },
    [DamageType.Ranged]: (piece, target) => {
        return defaultRepelTargets[DamageType.MeleeMedium](piece, target);
    },
};
//# sourceMappingURL=defaultDamageBehaviors.js.map