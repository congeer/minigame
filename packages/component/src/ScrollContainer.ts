import {FederatedPointerEvent} from "pixi.js";
import {Container} from "./Container";
import {Rect, RectOptions} from "./Rect";

export class ScrollContainer extends Rect {

    content?: Container;

    protected doView() {
        super.doView();

        const content = new Container();
        this.content = content;
        super.addChild(content);

        const mask = new Rect({
            width: this.opts?.width,
            height: this.opts?.height,
            backColor: 0, backAlpha: 1,
            zIndex: -1
        } as RectOptions);
        super.append(mask)
        content.mask = mask;

        let isMoving = false;
        const onDragMove = (event: FederatedPointerEvent) => {
            if (startScroll !== null) {
                isMoving = true;
                const y = startScroll + event.data.global.y;
                this.onDragMoving(y, content, mask);
            }
        }

        content.eventMode = 'static';
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
        this.eventMode = 'static';
        this.hitArea = mask.getBounds();
        this.on('pointerup', onDragEnd);
        this.on('pointerupoutside', onDragEnd);
        this['onwheel'] = (event) => {
            const y = content.y - event.deltaY;
            this.onDragMoving(y, content, mask);
        };

        content.on('pointerdown', onDragStart)
    }

    private onDragMoving(y: number, content: Container, mask: Rect) {
        if (y + content.height > mask.height + mask.y && y < mask.y) {
            content.y = y;
        } else if (y + content.height < mask.height + mask.y) {
            content.y = mask.height + mask.y - content.height;
        } else if (y > mask.y) {
            content.y = mask.y;
        }
    }

}
