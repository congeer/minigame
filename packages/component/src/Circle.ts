import {Shape, ShapeOptions} from "./Shape";

export type CircleOptions = {
    radius: number,
} & ShapeOptions

export class Circle extends Shape<CircleOptions> {

    protected doView() {
        let radius = this.opts.radius;
        if (this.opts?.borderWidth) {
            this.lineStyle(this.opts.borderWidth, this.opts.borderColor, this.opts.borderAlpha)
        }
        this.beginFill(this.opts.backColor, this.opts.backAlpha);
        const delta = (this.opts.borderWidth ?? 0) / 2;
        this.drawCircle(radius, radius, radius - delta)
        this.endFill();
    }

    set radius(radius: number) {
        this.review({radius});
    }

}
