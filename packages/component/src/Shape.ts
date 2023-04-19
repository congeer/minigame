import {Graphics, ObservablePoint} from "pixi.js";


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

export class Shape<T extends ShapeOptions> extends Graphics {

    opts: T;

    constructor(opts?: T) {
        super();
        this.opts = {...defaultOptions, ...opts};
        this.drawSelf();
    }

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    drawSelf() {
        this.doDraw();
        this.zIndex = this.opts.zIndex ?? -1;
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }

    protected doDraw() {

    }

    protected reDraw(opts) {
        this.opts = {...this.opts, ...opts}
        this.clear();
        this.drawSelf();
    }

    set backColor(backColor: number) {
        this.reDraw({backColor});
    }

    set borderColor(borderColor: number) {
        this.reDraw({borderColor});
    }

    set borderAlpha(borderAlpha: number) {
        this.reDraw({borderAlpha});
    }

    set backAlpha(backAlpha: number) {
        this.reDraw({backAlpha});
    }

    set borderWidth(borderWidth: number) {
        this.reDraw({borderWidth});
    }

}
