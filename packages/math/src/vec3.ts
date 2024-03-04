export class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static fromXYZ(x: number, y: number, z: number) {
        return new Vec3(x, y, z);
    }

    static fromArray(arr: number[]) {
        return new Vec3(arr[0], arr[1], arr[2]);
    }

    static ZERO = new Vec3();
    static ONE = new Vec3(1, 1, 1);
    static NEG_ONE = new Vec3(-1, -1, -1);
    static X = new Vec3(1, 0, 0);
    static Y = new Vec3(0, 1, 0);
    static Z = new Vec3(0, 0, 1);
    static NEG_X = new Vec3(-1, 0, 0);
    static NEG_Y = new Vec3(0, -1, 0);
    static NEG_Z = new Vec3(0, 0, -1);
}

