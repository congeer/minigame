import {Align, unit} from "@minigame/core";
import {DisplayObject, FederatedPointerEvent} from "pixi.js";
import {animate} from "popmotion";
import {Scroller} from "../utils/Scroller";
import {maxZIndex, minAlpha} from "./Constant";
import {Container} from "./Container";
import {Rect, RectOptions} from "./Rect";

export type Direction = 'vertical' | 'horizontal' | 'both';
export type Show = 'always' | 'auto' | 'never';

export type ScrollContainerOptions = {
    direction?: Direction,
    scroller?: Show,
    scrollerOptions?: RectOptions
} & RectOptions

export class ScrollContainer extends Rect<ScrollContainerOptions> {

    static defaultDirection: Direction = 'both'
    static defaultScroller: Show = 'auto'
    static defaultColor = 0x000000
    static defaultAlpha = minAlpha

    private readonly content: Container;
    private readonly scroller: Scroller;
    moving: boolean = false;
    private readonly scrollerX?: Rect;
    private readonly scrollerY?: Rect;

    constructor(opts?: ScrollContainerOptions) {
        super({
            direction: ScrollContainer.defaultDirection,
            scroller: ScrollContainer.defaultScroller,
            backColor: ScrollContainer.defaultColor,
            backAlpha: ScrollContainer.defaultAlpha,
            ...opts,
            scrollerOptions: {
                width: unit(10),
                height: unit(10),
                backAlpha: 0.9,
                backColor: 0x888888,
                borderWidth: unit(1),
                borderAlpha: 0.8,
                borderColor: 0xaaaaaa,
                round: unit(10),
                ...opts?.scrollerOptions,
                zIndex: maxZIndex,
            }
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
        const onScroll = (x: number, y: number) => {
            if (this.opts.scroller !== 'never') {
                this.scrollerX && (this.scrollerX.visible = true);
                this.scrollerY && (this.scrollerY.visible = true);
                this.scrollerX && (this.scrollerX.alpha = 1);
                this.scrollerY && (this.scrollerY.alpha = 1);
            }
            if (this.opts?.direction === 'vertical' || this.opts?.direction === 'both') {
                content.y = y;
                this.scrollerY && (this.scrollerY.y = -y * mask.height / content.height);
            }
            if (this.opts?.direction === 'horizontal' || this.opts?.direction === 'both') {
                content.x = x;
                this.scrollerX && (this.scrollerX.x = -x * mask.width / content.width);
            }
        };
        const onScrollEnd = () => {
            if (this.opts.scroller === 'auto') {
                animate({
                    to: 0,
                    from: 1,
                    duration: 300,
                    onUpdate: (v) => {
                        this.scrollerX && (this.scrollerX.alpha = v);
                        this.scrollerY && (this.scrollerY.alpha = v);
                    },
                    onComplete: () => {
                        this.scrollerX && (this.scrollerX.visible = false);
                        this.scrollerY && (this.scrollerY.visible = false);
                    }
                })
            }
        };
        const scroller = this.scroller = new Scroller(onScroll, onScrollEnd)
        if (this.opts?.scroller !== 'never') {
            if (this.opts?.direction === 'vertical' || this.opts?.direction === 'both') {
                this.scrollerY = new Rect({
                    ...this.opts.scrollerOptions,
                    height: 1,
                } as RectOptions);
                if (this.opts.scroller === 'auto') {
                    this.scrollerY.visible = false;
                }
                super.append(this.scrollerY, mask, {top: 0, right: 0});
            }
            if (this.opts?.direction === 'horizontal' || this.opts?.direction === 'both') {
                this.scrollerX = new Rect({
                    ...this.opts.scrollerOptions,
                    width: 1,
                } as RectOptions);
                if (this.opts.scroller === 'auto') {
                    this.scrollerX.visible = false;
                }
                super.append(this.scrollerX, mask, {bottom: 0, left: 0});
            }
        }

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
        this.updateScroll();
        return displayObject;
    }

    removeChildren(beginIndex?: number, endIndex?: number): DisplayObject[] {
        const children = this.content.removeChildren(beginIndex, endIndex);
        this.scroller.contentSize(this.width, this.height, this.content.width, this.content.height);
        this.updateScroll();
        return children;
    }

    removeChild(...child: DisplayObject[]): DisplayObject {
        const one = this.content.removeChild(...child);
        this.scroller.contentSize(this.width, this.height, this.content.width, this.content.height);
        this.updateScroll();
        return one;
    }

    align() {
        super.align();
        this.scroller.contentSize(this.width, this.height, this.content.width, this.content.height);
        this.updateScroll();
    }

    private updateScroll() {
        if (this.opts.scroller === 'never') {
            return;
        }
        if ((this.opts?.direction === 'horizontal' || this.opts?.direction === 'both') && this.content.width > this.width) {
            this.scrollerX!.rectWidth = this.width * this.width / this.content.width;
        }
        if ((this.opts?.direction === 'vertical' || this.opts?.direction === 'both') && this.content.height > this.height) {
            this.scrollerY!.rectHeight = this.height * this.height / this.content.height;
        }
    }

    set direction(direction: Direction) {
        this.opts.direction = direction;
    }

}
