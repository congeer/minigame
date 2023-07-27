import {Align} from "@minigame/core";
import {DisplayObject, FederatedPointerEvent} from "pixi.js";
import {Scroller} from "../utils/Scroller";
import {minAlpha} from "./Constant";
import {Container} from "./Container";
import {Rect, RectOptions} from "./Rect";

export type Direction = 'vertical' | 'horizontal' | 'both';

export type ScrollContainerOptions = {
    direction?: Direction
} & RectOptions

export class ScrollContainer extends Rect<ScrollContainerOptions> {

    static defaultDirection: Direction = 'both'
    static defaultColor = 0x000000
    static defaultAlpha = minAlpha

    content: Container;
    scroller: Scroller;
    moving: boolean = false;

    constructor(opts?: ScrollContainerOptions) {
        super({
            direction: ScrollContainer.defaultDirection,
            backColor: ScrollContainer.defaultColor,
            backAlpha: ScrollContainer.defaultAlpha,
            ...opts
        });
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
            switch (this.opts?.direction) {
                case 'vertical':
                    content.y = y;
                    break;
                case 'horizontal':
                    content.x = x;
                    break;
                default:
                    content.x = x;
                    content.y = y;
                    break;
            }
        })

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

    removeChildren(beginIndex?: number, endIndex?: number): DisplayObject[] {
        const children = this.content.removeChildren(beginIndex, endIndex);
        this.scroller.contentSize(this.width, this.height, this.content.width, this.content.height);
        return children;
    }

    removeChild(...child: DisplayObject[]): DisplayObject {
        const one = this.content.removeChild(...child);
        this.scroller.contentSize(this.width, this.height, this.content.width, this.content.height);
        return one;
    }

    align() {
        super.align();
        this.scroller.contentSize(this.width, this.height, this.content.width, this.content.height);
    }

    set direction(direction: Direction) {
        this.opts.direction = direction;
    }

}
