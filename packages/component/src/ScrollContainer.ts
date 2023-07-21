import {Container, DisplayObject, FederatedPointerEvent, ObservablePoint} from "pixi.js";
import {Rect, RectOptions} from "./Rect";


const defaultOptions: RectOptions = {
    borderWidth: 0,
    borderColor: 0xffffff,
    borderAlpha: 1,
    backColor: 0,
    backAlpha: 1,
}

export class ScrollContainer extends Rect {

    opts: any;

    content: Container;

    keepChildren: DisplayObject[] = [];

    constructor(opts?: RectOptions) {
        super(opts);
        this.opts = {...defaultOptions, ...opts};

        const content = new Container();
        this.content = content;
        super.addChild(content);

        const mask = new Rect({
            width: opts?.width,
            height: opts?.height,
            backColor: 0, backAlpha: 1,
            zIndex: -1
        });
        super.addChild(mask)
        content.mask = mask;

        let isMoving = false;
        const onDragMove = (event: FederatedPointerEvent) => {
            if (startScroll !== null) {
                isMoving = true;
                const y = startScroll + event.data.global.y;
                this.onDragMoving(y, content, mask);
            }
        }

        content.interactive = true;
        let startScroll: any = null;
        const onDragStart = (event: FederatedPointerEvent) => {
            if (content.height < mask.height) {
                return;
            }
            startScroll = content.y - event.data.global.y;
            this.on('pointermove', onDragMove);
        }
        const onDragEnd = () => {
            if (startScroll !== null) {
                isMoving = false;
                this.off('pointermove', onDragMove);
                startScroll = null;
            }
        }
        this.interactive = true;
        this.hitArea = mask.getBounds();
        this.on('pointerup', onDragEnd);
        this.on('pointerupoutside', onDragEnd);
        this['onwheel'] = (event) => {
            const y = content.y - event.deltaY;
            this.onDragMoving(y, content, mask);
        };

        content.on('pointerdown', onDragStart)
    }

    private onDragMoving(y: number, content: Container<DisplayObject>, mask: Rect) {
        if (y + content.height > mask.height + mask.y && y < mask.y) {
            content.y = y;
        } else if (y + content.height < mask.height + mask.y) {
            content.y = mask.height + mask.y - content.height;
        } else if (y > mask.y) {
            content.y = mask.y;
        }
    }

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    addChild(...children: DisplayObject[]) {
        this.keepChildren.push(...children);
        return this.content.addChild(...children);
    }

    removeChild(...children: DisplayObject[]) {
        this.keepChildren = this.keepChildren.filter(c => !children.includes(c));
        return this.content.removeChild(...children);
    }

}
