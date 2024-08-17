import { pieces, Piece } from "./piece.js";

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

export class Position {
    /**
     * 用于统一屏幕坐标和棋盘坐标
     * @param {number} x
     * @param {number} y
     * @property {number} screenX
     * @property {number} screenY
     * @property {number} gridX
     * @property {number} gridY
     */

    constructor(x, y, grid = true) {
        /**
         * @param {number} x
         * @param {number} y
         * @param {boolean} grid
         */
        if (grid) {
            this.fromGrid(x, y);
        } else {
            this.fromScreen(x, y);
        }
    }

    static _calculateGameboardSize = () => {
        // 读取棋盘图片实际显示大小
        let gameboardImage = document
            .getElementById("gameboard")
            .getElementsByClassName("background")[0]
            .getElementsByTagName("img")[0];
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

    fromScreen(x, y) {
        this.screenX = x;
        this.screenY = y;
        let leftClientDistance = this.screenX - gameboardLeftTopX;
        let bottomClientDistance = this.screenY - gameboardLeftTopY;
        let topClientDistance = gameboardRealHeight - bottomClientDistance;
        this.gridX = leftClientDistance / gameboardGridWidthPx;
        this.gridY = topClientDistance / gameboardGridHeightPx;
    }

    fromGrid(x, y) {
        this.gridX = x;
        this.gridY = y;
    }

    _calculateGridPos() {
        // 根据实际坐标计算网格坐标
        let leftClientDistance = this.screenX - gameboardLeftTopX;
        let bottomClientDistance = this.screenY - gameboardLeftTopY;
        let topClientDistance = gameboardRealHeight - bottomClientDistance;
        this.gridX = leftClientDistance / gameboardGridWidthPx;
        this.gridY = topClientDistance / gameboardGridHeightPx;
    }

    _calculateScreenPos() {
        // 根据网格坐标计算实际坐标
        let leftClientDistance = this.gridX * gameboardGridWidthPx;
        let topClientDistance = gameboardRealHeight - this.gridY * gameboardGridHeightPx;
        this.screenX = leftClientDistance + gameboardLeftTopX;
        this.screenY = topClientDistance + gameboardLeftTopY;
    }

    getGridPos() {
        return [this.gridX, this.gridY];
    }

    getScreenPos() {
        this._calculateScreenPos();
        return [this.screenX, this.screenY];
    }

    /**
     * @param {Position} other
     */
    nearby(other, distance = null) {
        if (distance === null) return this.integerGrid.equals(other.integerGrid);
        else return this.squareEuclideanDistance(other) < distance * distance;
    }

    manhattanDistance(other) {
        return Math.abs(this.gridX - other.gridX) + Math.abs(this.gridY - other.gridY);
    }
    squareEuclideanDistance(other) {
        return Math.pow(this.gridX - other.gridX, 2) + Math.pow(this.gridY - other.gridY, 2);
    }
    euclideanDistance(other) {
        return Math.sqrt(this.squareEuclideanDistance(other));
    }
    chebyshevDistance(other) {
        return Math.max(Math.abs(this.gridX - other.gridX), Math.abs(this.gridY - other.gridY));
    }

    /**
     * @returns {Position}
     */
    get integerGrid() {
        return new Position(Math.round(this.gridX), Math.round(this.gridY));
    }

    /**
     * @param {Position} other
     * @returns {boolean}
     */
    equals(other) {
        return this.gridX == other.gridX && this.gridY == other.gridY;
    }

    get x() {
        return this.gridX;
    }

    get y() {
        return this.gridY;
    }

    set x(x) {
        this.gridX = x;
    }

    set y(y) {
        this.gridY = y;
    }

    add(other) {
        return new Position(this.x + other.x, this.y + other.y, true);
    }

    /**
     * @returns {Piece?}
     */
    get piece() {
        for (let piece of pieces) {
            if (piece.position.gridX == this.gridX && piece.position.gridY == this.gridY) {
                return piece;
            }
        }
        return null;
    }
}
