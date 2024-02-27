import {component} from "@minigame/ecs";
import {Rotation3D, Vec3} from "./types";


@component
export class Transform {
    translation: Vec3
    rotation: Rotation3D
    scale: Vec3

    constructor() {
        this.translation = Vec3.ZERO;
        this.rotation = new Rotation3D();
        this.scale = Vec3.ONE;
    }
}
