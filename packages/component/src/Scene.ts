import {Align, app} from "@minigame/core";
import {DisplayObject} from "pixi.js";
import {Container} from "./Container";
import {Rect} from "./Rect";

const sceneMap: { [key: string]: new () => Scene } = {}

const stack: { cursor: Scene, args: any[] }[] = []

export const registerScene = (name: string, scene: new () => Scene) => {
    sceneMap[name] = scene
}

export const registerScenes = (scenes: { [key: string]: new () => Scene }) => {
    Object.assign(sceneMap, scenes)
}

export const navigateTo = (name: string, ...args: any[]) => {
    const constructor = sceneMap[name]
    if (constructor) {
        const cursor = new constructor();
        stack[stack.length - 1]?.cursor.hide()
        cursor.show(...args)
        stack.push({cursor, args})
    }
}

export const replaceScene = (name: string, ...args: any[]) => {
    const constructor = sceneMap[name]
    if (constructor) {
        const pop = stack.pop();
        if (pop) {
            const pre = pop.cursor;
            pre.destroy();
        }
        const cursor = new constructor();
        stack[stack.length - 1]?.cursor.hide()
        cursor.show(...args)
        stack.push({cursor, args})
    }
}

export const navigateBack = () => {
    if (stack.length < 2) return
    const pre = stack.pop()!.cursor;
    pre.destroy();
    const {cursor, args} = stack[stack.length - 1]
    cursor.show(...args)
}

export const removeScene = (index: number) => {
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

type ChildCache = {
    child: DisplayObject,
    parent?: Container | undefined,
    align?: Align
}

export abstract class Scene extends Container {

    static defaultColor = 0x000000

    hideFn: (() => void) | void = undefined;

    childAlignCache: ChildCache[] = [];

    protected constructor(opts?: BackGroundProps) {
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
        const background = this.children[0] as Rect<any>;
        background.backColor = color;
    }

    reset() {
        if (this.children.length > 1) {
            this.removeChildren(0)
        }
    }

    destroy() {
        this.hide();
        app.stage.removeChild(this);
    }

    protected abstract view(...args: any[]): (() => void) | void

    show(...args: any[]) {
        this.childAlignCache = [];
        this.reset();
        this.visible = true;
        this.hideFn = this.view(...args);
    }

    hide() {
        this.hideFn && this.hideFn();
        this.visible = false;
        this.reset();
        this.childAlignCache = [];
    }

}
