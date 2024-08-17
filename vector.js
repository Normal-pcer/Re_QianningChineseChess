import { Position } from "./position.js";

export class Vector2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * 
     * @param {Position} origin 
     * @param {Position} target 
     * @returns {Vector2}
     */
    static of(origin, target) {
        return new Vector2(target.x - origin.x, target.y - origin.y);
    }
    /**
     * @param {Vector2} v 
     * @returns {Vector2}
     */
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    /**
     * @param {Vector2} v 
     * @returns {Vector2}
     */
    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }
    /**
     * @param {int} s
     * @returns {Vector2}
     */
    mul(s) {
        return new Vector2(this.x * s, this.y * s);
    }
    /**
     * @param {int} s
     * @returns {Vector2}
     */
    div(s) {
        return new Vector2(this.x / s, this.y / s);
    }
    /**
     * @returns {number}
     */
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
     * @param {Vector2} v 
     * @returns {number}
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    /**
     * @returns {Vector2}
     */
    normalize() {
        return this.div(this.length);
    }
}