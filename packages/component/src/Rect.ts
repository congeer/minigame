import {Graphics} from "pixi.js";


type Options = {
    borderColor?: number,
    borderWidth?: number,
    borderAlpha?: number,
    backColor?: number,
    backAlpha?: number
    width: number,
    height: number,
    zIndex?: number
}
const defaultOptions: Options = {
    borderWidth: 0,
    borderColor: 0xffffff,
    borderAlpha: 1,
    backColor: 0,
    backAlpha: 1,
    width: 0,
    height: 0
}

export class Rect extends Graphics {

    opts: Options;

    constructor(opts?: Options) {
        super();
        this.opts = {...defaultOptions, ...opts};
        this.drawSelf();
    }

    drawSelf() {
        if (this.opts?.borderWidth) {
            this.lineStyle(this.opts.borderWidth, this.opts.borderColor, this.opts.borderAlpha)
        }
        this.beginFill(this.opts.backColor, this.opts.backAlpha);
        const margin = this.opts.borderWidth / 2;
        const delta = this.opts.borderWidth;
        this.drawRect(margin, margin, this.opts.width - delta, this.opts.height - delta)
        this.endFill();
        this.zIndex = this.opts.zIndex ?? -1;
    }

    reDraw(opts) {
        this.opts = {...this.opts, ...opts}
        this.clear();
        this.drawSelf();
    }

    set rectHeight(height: number) {
        this.reDraw({height});
    }

    set rectWidth(width: number) {
        this.reDraw({width});
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
