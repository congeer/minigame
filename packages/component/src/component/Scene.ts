import {Align, app, config} from "@minigame/core";
import {DisplayObject} from "pixi.js";
import {Container} from "./Container";
import {Rect} from "./Rect";

type BackGroundProps = {
    color?: number
}

type ChildCache = {
    child: DisplayObject,
    parent?: Container | undefined,
    align?: Align
}

export abstract class Scene extends Rect {

    static defaultColor = 0

    hideFn: (() => void) | void = undefined;

    childAlignCache: ChildCache[] = [];

    protected constructor(opts?: BackGroundProps) {
        super({
            width: config.innerWidth,
            height: config.innerHeight,
            backColor: opts?.color ?? Scene.defaultColor,
        });
        this.x = (innerWidth - config.innerWidth) / 2;
        this.y = (innerHeight - config.innerHeight) / 2;
        app.stage.addChild(this);
    }

    reset() {
        this.removeChildren();
    }

    destroy() {
        super.destroy();
        this.hide();
        app.stage.removeChild(this);
    }

    append(child: DisplayObject, parent?: DisplayObject | Align, alignOpt?: Align): DisplayObject {
        if (parent && !(parent instanceof DisplayObject)) {
            alignOpt = parent;
            parent = undefined;
        }
        return this.alignHolder.append(child, parent, alignOpt);
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
