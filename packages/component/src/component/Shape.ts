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
        this.draw();
    }

    draw() {
        this.drawer();
        this.zIndex = this.opts.zIndex ?? -1;
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }

    protected abstract drawer(): void;

    redraw(opts?: T) {
        this.opts = {...this.opts, ...opts}
        this.clear();
        this.draw();
    }

    set backColor(backColor: number) {
        this.redraw({backColor} as T);
    }

    set borderColor(borderColor: number) {
        this.redraw({borderColor} as T);
    }

    set borderAlpha(borderAlpha: number) {
        this.redraw({borderAlpha} as T);
    }

    set backAlpha(backAlpha: number) {
        this.redraw({backAlpha} as T);
    }

    set borderWidth(borderWidth: number) {
        this.redraw({borderWidth} as T);
    }

}
