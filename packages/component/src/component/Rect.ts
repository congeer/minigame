import {Shape, ShapeOptions} from "./Shape";


export type RectOptions = {
    width?: number,
    height?: number,
    round?: number
} & ShapeOptions

export class Rect<T extends RectOptions = RectOptions> extends Shape<T> {

    protected drawer() {
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

    set rectHeight(height: number) {
        this.redraw({height} as T);
    }

    set rectWidth(width: number) {
        this.redraw({width} as T);
    }

    set round(round: number) {
        this.redraw({round} as T);
    }

}
