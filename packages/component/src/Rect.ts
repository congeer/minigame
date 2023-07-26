import {ObservablePoint} from "pixi.js";
import {Shape, ShapeOptions} from "./Shape";


export type RectOptions = {
    width?: number,
    height?: number,
    round?: number
} & ShapeOptions

export class Rect<T extends RectOptions = RectOptions> extends Shape<T> {

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    protected doView() {
        if (!this.opts.width || !this.opts.height) {
            return;
        }
        if (this.opts?.borderWidth) {
            this.lineStyle(this.opts.borderWidth, this.opts.borderColor, this.opts.borderAlpha)
        }
        this.beginFill(this.opts.backColor, this.opts.backAlpha);
        const delta = this.opts.borderWidth ?? 0;
        const margin = delta / 2;
        if (this.opts.round) {
            this.drawRoundedRect(margin, margin, this.opts.width - delta, this.opts.height - delta, this.opts.round);
        } else {
            this.drawRect(margin, margin, this.opts.width - delta, this.opts.height - delta)
        }
        this.endFill();
    }

    set height(height: number) {
        this.review({height} as T);
    }

    set width(width: number) {
        this.review({width} as T);
    }

    set round(round: number) {
        this.review({round} as T);
    }

}
