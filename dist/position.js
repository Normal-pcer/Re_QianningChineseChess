import { pieces } from "./piece.js";
import { PositionedItem } from "./positionedItem.js";
// 用于计算屏幕坐标的量
var gameboardRealWidth;
var gameboardRealHeight;
var gameboardLeftTopX;
var gameboardLeftTopY;
var gameboardGridWidthPx;
var gameboardGridHeightPx;
var gameboardImageWidth;
var gameboardImageHeight;
const gameboardGridWidth = 9;
const gameboardGridHeight = 10;
const gameboardImageMarginTop = 39 / 603;
const gameboardImageMarginLeft = 39 / 545;
export class Position extends PositionedItem {
    /**
     * 屏幕坐标的X轴，单位为像素。
     * 请不要直接访问这个值，而是通过screenX访问器访问，否则可能会获得未更新的坐标或NaN。
     */
    _screenX = NaN;
    /**
     * 屏幕坐标的Y轴，单位为像素。
     * 请不要直接访问这个值，而是通过screenY访问器访问，否则可能会获得未更新的坐标或NaN。
     */
    _screenY = NaN;
    /**
     * 网格坐标的X轴，单位为格点。
     * 网格坐标不会随着屏幕坐标的变化而变化。
     * 构造函数会自动将屏幕坐标转换为网格坐标，所以该值实际上不会为NaN。
     */
    x = NaN;
    /**
     * 网格坐标的Y轴，单位为格点。
     * 网格坐标不会随着屏幕坐标的变化而变化。
     * 构造函数会自动将屏幕坐标转换为网格坐标，所以该值实际上不会为NaN。
     */
    y = NaN;
    constructor(x, y, grid = true) {
        super();
        if (grid) {
            this.fromGrid(x, y);
        }
        else {
            this.fromScreen(x, y);
        }
    }
    /**
     * 重新计算棋盘的大小，以进行正确的坐标转换。
     * 该方法会在查询屏幕坐标时自动调用，无需手动调用。
     */
    static _calculateGameboardSize = () => {
        // 读取棋盘图片实际显示大小
        let gameboardImage = document.querySelector("#gameboard .background img");
        gameboardImageWidth = gameboardImage.width;
        gameboardImageHeight = gameboardImage.height;
        // 不计图片边距的大小
        gameboardRealWidth = gameboardImageWidth * (1 - gameboardImageMarginLeft * 2);
        gameboardRealHeight = gameboardImageHeight * (1 - gameboardImageMarginTop * 2);
        // 获取棋盘左上角格点实际位置（像素）
        gameboardLeftTopX = gameboardImage.offsetLeft + gameboardImageMarginLeft * gameboardImageWidth;
        gameboardLeftTopY = gameboardImage.offsetTop + gameboardImageMarginTop * gameboardImageHeight;
        // 获取棋盘格点实际大小（像素）
        gameboardGridWidthPx = gameboardRealWidth / (gameboardGridWidth - 1);
        gameboardGridHeightPx = gameboardRealHeight / (gameboardGridHeight - 1);
    };
    static of(source) {
        return new Position(source.x, source.y, true);
    }
    fromScreen(x, y) {
        this._screenX = x;
        this._screenY = y;
        let leftClientDistance = this._screenX - gameboardLeftTopX;
        let bottomClientDistance = this._screenY - gameboardLeftTopY;
        let topClientDistance = gameboardRealHeight - bottomClientDistance;
        this.x = leftClientDistance / gameboardGridWidthPx;
        this.y = topClientDistance / gameboardGridHeightPx;
    }
    fromGrid(x, y) {
        this.x = x;
        this.y = y;
    }
    _calculateGridPos() {
        // 根据实际坐标计算网格坐标
        let leftClientDistance = this._screenX - gameboardLeftTopX;
        let bottomClientDistance = this._screenY - gameboardLeftTopY;
        let topClientDistance = gameboardRealHeight - bottomClientDistance;
        this.x = leftClientDistance / gameboardGridWidthPx;
        this.y = topClientDistance / gameboardGridHeightPx;
    }
    _calculateScreenPos() {
        // 根据网格坐标计算实际坐标
        let leftClientDistance = this.x * gameboardGridWidthPx;
        let topClientDistance = gameboardRealHeight - this.y * gameboardGridHeightPx;
        this._screenX = leftClientDistance + gameboardLeftTopX;
        this._screenY = topClientDistance + gameboardLeftTopY;
    }
    getGridPos() {
        return [this.x, this.y];
    }
    getScreenPos() {
        this._calculateScreenPos();
        return [this._screenX, this._screenY];
    }
    get screenX() {
        this._calculateScreenPos();
        return this._screenX;
    }
    get screenY() {
        this._calculateScreenPos();
        return this._screenY;
    }
    nearby(other, distance = null) {
        if (distance === null)
            return this.integerGrid().equals(other.integerGrid());
        else
            return this.squareEuclideanDistance(other) < distance * distance;
    }
    manhattanDistance(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }
    squareEuclideanDistance(other) {
        return Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2);
    }
    euclideanDistance(other) {
        return Math.sqrt(this.squareEuclideanDistance(other));
    }
    chebyshevDistance(other) {
        return Math.max(Math.abs(this.x - other.x), Math.abs(this.y - other.y));
    }
    /**
     * @param toZero 为true时，正偏移将倾向于远离0，而非数值更大
     * @returns
     */
    integerGrid(offsetX = 0, offsetY = 0, toZero = false) {
        if (toZero) {
            offsetX *= Math.sign(this.x);
            offsetY *= Math.sign(this.y);
        }
        return new Position(Math.floor(this.x + 0.5 + offsetX), Math.floor(this.y + 0.5 + offsetY));
    }
    equals(other) {
        return this.x == other.x && this.y == other.y;
    }
    add(other) {
        return new Position(this.x + other.x, this.y + other.y, true);
    }
    /**
     * @returns {Piece?}
     */
    get owner() {
        for (let piece of pieces) {
            if (piece.position.x == this.x && piece.position.y == this.y) {
                return piece;
            }
        }
        return null;
    }
    toString() {
        if (0 <= this.x && this.x <= 8 && 0 <= this.y && this.y <= 9) {
            let letterX = String.fromCharCode("A".charCodeAt(0) + this.x);
            let numberY = this.y.toString();
            return letterX + numberY;
        }
        return `(${this.x}, ${this.y})`;
    }
}
//# sourceMappingURL=position.js.map