import {align, app} from "@minigame/core";
import {Align} from "@minigame/core/src";
import {Container, DisplayObject} from "pixi.js";
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

export class Scene extends Container {

    static defaultColor = 0x000000

    hideFn: (() => void) | void = undefined;

    childrenCache: ChildCache[] = [];

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

    view(...args: any[]): (() => void) | void {
    }

    append(child: DisplayObject, parent?: Container | Align, alignOpt?: Align) {
        if (parent && !(parent instanceof Container)) {
            alignOpt = parent
            parent = undefined
        }
        this.addChild(child)
        if (!parent && !alignOpt) return
        this.childrenCache.push({child, parent, align: alignOpt})
    }

    show(...args: any[]) {
        this.childrenCache = [];
        this.reset();
        this.visible = true;
        this.hideFn = this.view(...args);
        for (let i = this.childrenCache.length - 1; i >= 0; i--) {
            const {child, parent, align: opt} = this.childrenCache[i]
            align(child, parent, opt)
        }
    }

    hide() {
        this.hideFn && this.hideFn();
        this.visible = false;
        this.reset();
        this.childrenCache = [];
    }

}
