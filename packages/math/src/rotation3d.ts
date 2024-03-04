import {Rotation2D} from "./rotation2d";
import {Vec3} from "./vec3";
import {Vec4} from "./vec4";

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
