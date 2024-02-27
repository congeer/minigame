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


export class Rotation3D {
    value: Vec4;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.value = new Vec4(x, y, z, w);
    }

    static fromXYZW(x: number, y: number, z: number, w: number) {
        return new Rotation3D(x, y, z, w);
    }

    static fromArray(arr: number[]) {
        return new Rotation3D(arr[0], arr[1], arr[2], arr[3]);
    }

    static fromAxisAngle(axis: Vec3, angle: number) {
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        return new Rotation3D(axis.x * s, axis.y * s, axis.z * s, Math.cos(halfAngle));
    }

    static fromEuler(x: number, y: number, z: number) {
        const halfX = x / 2;
        const halfY = y / 2;
        const halfZ = z / 2;
        const cx = Math.cos(halfX);
        const cy = Math.cos(halfY);
        const cz = Math.cos(halfZ);
        const sx = Math.sin(halfX);
        const sy = Math.sin(halfY);
        const sz = Math.sin(halfZ);
        return new Rotation3D(
            sx * cy * cz + cx * sy * sz,
            cx * sy * cz - sx * cy * sz,
            cx * cy * sz + sx * sy * cz,
            cx * cy * cz - sx * sy * sz
        );
    }

    static fromEulerArray(arr: number[]) {
        return Rotation3D.fromEuler(arr[0], arr[1], arr[2]);
    }

    static fromEulerVec3(vec: Vec3) {
        return Rotation3D.fromEuler(vec.x, vec.y, vec.z);
    }

    static fromRotation2D(rot: Rotation2D) {
        return new Rotation3D(0, 0, 1, rot.value);
    }


}

export class Rotation2D {
    value: number;

    constructor(rotate: number = 0) {
        this.value = rotate;
    }

    static fromDegree(degree: number) {
        return new Rotation2D(degree * Math.PI / 180);
    }

    static fromRadian(radian: number) {
        return new Rotation2D(radian);
    }

    to3D() {
        return new Rotation3D(0, 0, 1, this.value);
    }

    toDegree() {
        return this.value * 180 / Math.PI;
    }

    toRadian() {
        return this.value;
    }

}
