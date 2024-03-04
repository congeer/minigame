export class Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    static ZERO = new Vec4();
    static ONE = new Vec4(1, 1, 1, 1);
    static NEG_ONE = new Vec4(-1, -1, -1, -1);
    static X = new Vec4(1, 0, 0, 0);
    static Y = new Vec4(0, 1, 0, 0);
    static Z = new Vec4(0, 0, 1, 0);
    static W = new Vec4(0, 0, 0, 1);
    static NEG_X = new Vec4(-1, 0, 0, 0);
    static NEG_Y = new Vec4(0, -1, 0, 0);
    static NEG_Z = new Vec4(0, 0, -1, 0);
    static NEG_W = new Vec4(0, 0, 0, -1);

}
