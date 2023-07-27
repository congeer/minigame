import {app, config, unit} from "@minigame/core";
import {Container as PIXIContainer, DisplayObject} from "pixi.js";
import {Container} from "./Container";
import {Rect, RectOptions} from "./Rect";

export type ModalOptions = {
    title?: string
    border?: number
    color?: number

    height?: number
    canClose?: boolean
    onClose?: () => any
    onOpen?: () => any

    parent?: PIXIContainer
}

export class Modal extends Rect {
    static defaultBorder = 0xffffff
    static defaultColor = 0x000000
    static defaultAlpha = 1

    modalOptions?: ModalOptions
    content: Container
    onClose?: () => any
    onOpen?: () => any
    private isOpen: boolean = false
    private parentContainer: PIXIContainer
    private contentMask: Rect

    constructor(opts?: ModalOptions) {
        super({
            width: config.innerWidth,
            height: config.innerHeight,
            backColor: 0x000000,
            backAlpha: 0.5
        })
        this.visible = false;
        this.x = (innerWidth - config.innerWidth) / 2;
        this.y = (innerHeight - config.innerHeight) / 2;
        this.onClose = opts?.onClose;
        this.onOpen = opts?.onOpen;
        this.parentContainer = opts?.parent ?? app.stage;
        this.modalOptions = opts;
        const scale = 0.8;
        const height = this.modalOptions?.height ?? config.innerHeight * scale * 0.8;
        const width = config.innerWidth * scale;

        const content = new Rect({
            width: width,
            height: height,
            backAlpha: Modal.defaultAlpha,
            borderColor: this.modalOptions?.border ?? Modal.defaultBorder,
            backColor: this.modalOptions?.color ?? Modal.defaultColor,
            borderWidth: unit(8)
        })
        content.eventMode = 'static';
        content.on('pointerdown', (e) => {
            e.stopPropagation();
        })
        this.content = content;

        this.zIndex = 999

        content.zIndex = 1000

        const contentMask = this.contentMask = new Rect({
            width: width,
            height: height,
        } as RectOptions)
        content.addChild(contentMask);
        content.mask = contentMask;

        this.append(content, {})

        this.eventMode = 'static';

        this.on('pointerdown', () => {
            if (this.modalOptions?.canClose) {
                this.close();
            }
        })
    }

    appendContent(child: DisplayObject) {
        return this.content.append(child);
    }

    get contentWidth(): number {
        return this.content.width;
    }

    get contentHeight(): number {
        return this.content.height;
    }

    set contentWidth(width: number) {
        this.content.width = width;
        this.contentMask.width = width;
    }

    set contentHeight(height: number) {
        this.content.height = height;
        this.contentMask.height = height;
    }

    open() {
        if (this.isOpen) {
            return;
        }
        this.visible = true;
        this.parentContainer.addChild(this);
        this.onOpen && this.onOpen()
        this.isOpen = true;
    }

    close() {
        if (!this.isOpen) {
            return;
        }
        this.visible = false;
        this.parentContainer.removeChild(this)
        this.onClose && this.onClose()
        this.isOpen = false;
    }

}
