import {align, Align, app, config} from "@minigame/core";
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
            width: config.safeArea.width,
            height: config.safeArea.height,
            backColor: opts?.color ?? Scene.defaultColor,
        });
        align(this, {
            top: 0,
            left: innerWidth / 2 - this.width / 2,
        })
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
