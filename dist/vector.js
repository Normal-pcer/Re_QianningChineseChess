export class Vector2 {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static point(origin, target) {
        return new Vector2(target.x - origin.x, target.y - origin.y);
    }
    static of(source) {
        return new Vector2(source.x, source.y);
    }
    static zero() {
        return new Vector2(0, 0);
    }
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }
    mul(s) {
        return new Vector2(this.x * s, this.y * s);
    }
    div(s) {
        return new Vector2(this.x / s, this.y / s);
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    normalize() {
        return this.div(this.length);
    }
}
//# sourceMappingURL=vector.js.map