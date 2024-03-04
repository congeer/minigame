export class Vec2 {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    static fromXY(x: number, y: number) {
        return new Vec2(x, y);
    }

    static fromArray(arr: number[]) {
        return new Vec2(arr[0], arr[1]);
    }

    static ZERO = new Vec2();
    static ONE = new Vec2(1, 1);
    static NEG_ONE = new Vec2(-1, -1);
    static X = new Vec2(1, 0);
    static Y = new Vec2(0, 1);
    static NEG_X = new Vec2(-1, 0);
    static NEG_Y = new Vec2(0, -1);
}
