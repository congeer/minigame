import {app} from "@minigame/core";
import {Container} from "pixi.js";
import {Rect} from "./Rect";

const scene: { [key: string]: typeof Scene } = {}

const stack: { cursor: Scene, args: any[] }[] = []

export const registerScene = (name: string, constructor: typeof Scene) => {
    scene[name] = constructor
}

export const registerScenes = (scenes: { [key: string]: typeof Scene }) => {
    Object.assign(scene, scenes)
}

export const navigateTo = (name: string, ...args: any[]) => {
    const constructor = scene[name]
    if (constructor) {
        const cursor = new constructor();
        stack[stack.length - 1]?.cursor.hide()
        cursor.show(...args)
        stack.push({cursor, args})
    }
}

export const replaceScene = (name: string, ...args: any[]) => {
    const constructor = scene[name]
    if (constructor) {
        const pre = stack.pop().cursor;
        pre.destroy();
        const cursor = new constructor();
        stack[stack.length - 1]?.cursor.hide()
        cursor.show(...args)
        stack.push({cursor, args})
    }
}

export const navigateBack = () => {
    if (stack.length < 2) return navigateTo('entry')
    const pre = stack.pop().cursor;
    pre.destroy();
    const {cursor, args} = stack[stack.length - 1]
    cursor.show(...args)
}

export const removeScene = (index) => {
    if (index === -1) {
        const current = stack.pop();
        if (current) current.cursor.destroy();
    }
    const current = stack[index];
    if (current) {
        current.cursor.destroy();
        stack.splice(index, 1)
    }
}

type BackGroundProps = {
    color?: number
}

export class Scene extends Container {

    static defaultColor = 0x000000

    constructor(opts?: BackGroundProps) {
        super();
        const background = new Rect({
            width: app.screen.width,
            height: app.screen.height,
            backColor: opts?.color ?? Scene.defaultColor,
            zIndex: -1
        });
        this.addChild(background);
        app.stage.addChild(this)
    }

    set color(color: number) {
        const background = this.children[0] as Rect;
        background.backColor = color;
    }

    reset() {
        if (this.children.length > 1) {
            this.removeChildren(1)
        }
    }

    destroy() {
        this.hide();
        app.stage.removeChild(this);
    }

    draw() {
    }

    show(...args: any[]) {
        this.reset();
        this.visible = true;
        this.draw();
    }

    hide() {
        this.visible = false;
        this.reset();
    }

}
