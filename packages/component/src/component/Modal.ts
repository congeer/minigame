import {Align, app, config, unit} from "@minigame/core";
import {DisplayObject} from "pixi.js";
import {Container} from "./Container";
import {Graphics} from "./Graphics";
import {Rect, RectOptions} from "./Rect";

export type ModalOptions = {
    title?: string
    canClose?: boolean
    onClose?: () => any
    onOpen?: () => any
    parent?: Container | Graphics
} & RectOptions

export class Modal extends Rect {
    static defaultBorderColor = 0xffffff
    static defaultBorderWidth = unit(4)
    static defaultColor = 0x000000
    static defaultAlpha = 1

    modalOptions?: ModalOptions
    content: Container
    onClose?: () => any
    onOpen?: () => any
    private isOpen: boolean = false
    private parentContainer: Container | Graphics
    private contentMask: Rect

    constructor(opts?: ModalOptions) {
        super({
            width: config.innerWidth,
            height: config.innerHeight,
            backColor: 0x000000,
            backAlpha: 0.5
        })
        this.x = config.innerX;
        this.y = config.innerY;
        this.visible = false;
        this.onClose = opts?.onClose;
        this.onOpen = opts?.onOpen;
        this.parentContainer = opts?.parent ?? this;
        this.modalOptions = opts;
        const scale = 0.8;
        const height = this.modalOptions?.height ?? config.innerHeight * scale * 0.8;
        const width = config.innerWidth * scale;

        const content = new Rect({
            width: width,
            height: height,
            backAlpha: Modal.defaultAlpha,
            borderColor: Modal.defaultBorderColor,
            backColor: Modal.defaultColor,
            borderWidth: Modal.defaultBorderWidth,
            ...this.modalOptions
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

        this.append(content, this.parentContainer, {})

        this.eventMode = 'static';

        this.on('pointerdown', () => {
            if (this.modalOptions?.canClose) {
                this.close();
            }
        })
    }

    appendContent(child: DisplayObject, parent?: Container | Graphics, align?: Align) {
        return this.content.append(child, parent, align);
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
        app.stage.addChild(this);
        this.onOpen && this.onOpen()
        this.isOpen = true;
    }

    close() {
        if (!this.isOpen) {
            return;
        }
        this.visible = false;
        app.stage.removeChild(this)
        this.onClose && this.onClose()
        this.isOpen = false;
    }

}
