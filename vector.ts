import { Position } from "./position.js";
import { PositionedItem } from "./positionedItem.js";

export class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static point(origin: PositionedItem, target: PositionedItem) {
        return new Vector2(target.x - origin.x, target.y - origin.y);
    }

    static of(source: PositionedItem) {
        return new Vector2(source.x, source.y);
    }

    static zero() {
        return new Vector2(0, 0);
    }

    add(v: PositionedItem) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }


    sub(v: PositionedItem) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    mul(s: number) {
        return new Vector2(this.x * s, this.y * s);
    }

    div(s: number) {
        return new Vector2(this.x / s, this.y / s);
    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    dot(v: Vector2) {
        return this.x * v.x + this.y * v.y;
    }

    normalize() {
        return this.div(this.length);
    }
}