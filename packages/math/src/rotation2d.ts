import {Rotation3D} from "./rotation3d";

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
