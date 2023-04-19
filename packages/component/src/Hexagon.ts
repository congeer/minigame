import {Shape, ShapeOptions} from "./Shape";


type Options = {
    side: number,
} & ShapeOptions

export class Hexagon extends Shape<Options> {

    protected doDraw() {
        if (this.opts?.borderWidth) {
            this.lineStyle(this.opts.borderWidth, this.opts.borderColor, this.opts.borderAlpha)
        }
        const delta = (this.opts.borderWidth ?? 0) / 1.732
        const side = this.opts.side - delta;
        const half = side / 2;
        const radius = 1.732 * half;
        this.beginFill(this.opts.backColor, this.opts.backAlpha);
        this.drawPolygon([
            -half, -radius,
            half, -radius,
            2 * half, 0,
            half, radius,
            -half, radius,
            -2 * half, 0
        ])
        this.endFill();
    }

    set side(side) {
        this.reDraw({side})
    }

}
