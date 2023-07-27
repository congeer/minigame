import {Align} from "@minigame/core";
import {DisplayObject, FederatedPointerEvent} from "pixi.js";
import {Scroller} from "../utils/Scroller";
import {minAlpha} from "./Constant";
import {Container} from "./Container";
import {Rect, RectOptions} from "./Rect";

export type ScrollContainerOptions = RectOptions & {
    direction?: 'vertical' | 'horizontal' | 'both'
}

const defaultScrollOptions: ScrollContainerOptions = {
    width: 0,
    height: 0,
    direction: 'both',
    backAlpha: minAlpha,
    backColor: 0x000000
}

export class ScrollContainer extends Rect<ScrollContainerOptions> {

    content: Container;
    scroller: Scroller;
    moving: boolean = false;

    constructor(opts?: ScrollContainerOptions) {
        super({...defaultScrollOptions, ...opts});
        const content = this.content = new Container();
        const mask = new Rect({
            width: this.opts?.width,
            height: this.opts?.height,
            backColor: 0, backAlpha: 1,
            zIndex: -1
        } as RectOptions);
        content.mask = mask;
        this.addChild(content, mask)

        const scroller = this.scroller = new Scroller((x, y) => {
            if (this.opts?.direction === 'vertical') {
                content.y = y;
            } else if (this.opts?.direction === 'horizontal') {
                content.x = x;
            } else {
                content.x = x;
                content.y = y;
            }
        })
        scroller.contentSize(mask.width, mask.height, content.width, content.height);

        const onDragMove = (event: FederatedPointerEvent) => {
            scroller.doTouchMove(event.global.x, event.global.y, event.originalEvent.timeStamp);
        }

        content.eventMode = 'static';
        const onDragStart = (event: FederatedPointerEvent) => {
            scroller.doTouchStart(event.global.x, event.global.y);
            this.on('pointermove', onDragMove);
            this.moving = true;
        }
        const onDragEnd = (event: FederatedPointerEvent) => {
            scroller.doTouchEnd(event.originalEvent.timeStamp);
            this.off('pointermove', onDragMove);
            this.moving = false;
        }
        this.eventMode = 'static';
        this.hitArea = mask.getBounds();
        this.on('pointerdown', onDragStart)
        this.on('pointerup', onDragEnd);
        this.on('pointerupoutside', onDragEnd);
        this['onwheel'] = (event) => {
            this.scroller.wheel(event.deltaX, event.deltaY);
        };

    }

    append(child: DisplayObject, parent?: Container | Align, alignOpt?: Align): DisplayObject {
        const displayObject = this.content.append(child, parent, alignOpt);
        this.scroller.contentSize(this.width, this.height, this.content.width, this.content.height);
        return displayObject;
    }

}
