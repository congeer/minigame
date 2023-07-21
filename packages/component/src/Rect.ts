import {ObservablePoint} from "pixi.js";
import {Shape, ShapeOptions} from "./Shape";


export type RectOptions = {
    width?: number,
    height?: number,
} & ShapeOptions

export class Rect extends Shape<RectOptions> {

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    protected doDraw() {
        if (!this.opts.width || !this.opts.height) {
            return;
        }
        if (this.opts?.borderWidth) {
            this.lineStyle(this.opts.borderWidth, this.opts.borderColor, this.opts.borderAlpha)
        }
        this.beginFill(this.opts.backColor, this.opts.backAlpha);
        const delta = this.opts.borderWidth ?? 0;
        const margin = delta / 2;
        this.drawRect(margin, margin, this.opts.width - delta, this.opts.height - delta)
        this.endFill();
    }

    set rectHeight(height: number) {
        this.reDraw({height});
    }

    set rectWidth(width: number) {
        this.reDraw({width});
    }

}
