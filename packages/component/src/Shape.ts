import {ObservablePoint} from "pixi.js";
import {Graphics} from "./Graphics"


export type ShapeOptions = {
    borderColor?: number,
    borderWidth?: number,
    borderAlpha?: number,
    backColor?: number,
    backAlpha?: number
    zIndex?: number
}

const defaultOptions: ShapeOptions = {
    borderWidth: 0,
    borderColor: 0xffffff,
    borderAlpha: 1,
    backColor: 0,
    backAlpha: 1,
}

export abstract class Shape<T extends ShapeOptions> extends Graphics {

    opts: T;

    constructor(opts?: T) {
        super();
        this.opts = {...defaultOptions, ...opts} as T;
        this.view();
    }

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    view() {
        this.doView();
        this.zIndex = this.opts.zIndex ?? -1;
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }

    protected abstract doView(): void;

    protected review(opts?: T) {
        this.opts = {...this.opts, ...opts}
        this.removeChildren();
        this.removeAllListeners();
        this.clear();
        this.view();
    }

    set backColor(backColor: number) {
        this.review({backColor} as T);
    }

    set borderColor(borderColor: number) {
        this.review({borderColor} as T);
    }

    set borderAlpha(borderAlpha: number) {
        this.review({borderAlpha} as T);
    }

    set backAlpha(backAlpha: number) {
        this.review({backAlpha} as T);
    }

    set borderWidth(borderWidth: number) {
        this.review({borderWidth} as T);
    }

}
