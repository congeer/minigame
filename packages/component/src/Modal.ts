import {align, app, unit} from "@minigame/core";
import {Container, DisplayObject} from "pixi.js";
import {Rect} from "./Rect";

type Options = {
    title?: string
    border?: number
    color?: number

    height?: number
    canClose?: boolean
    onClose?: () => any
    onOpen?: () => any

    parent?: Container
}

export class Modal extends Container {

    static defaultBorder = 0xffffff

    static defaultColor = 0x000000

    static defaultAlpha = 1

    content: Container

    onClose?: () => any

    onOpen?: () => any

    private isOpen: boolean = false

    private parentContainer: Container

    private contentMask: Rect

    constructor(opts?: Options) {
        super()
        this.onClose = opts?.onClose;
        this.onOpen = opts?.onOpen;
        this.parentContainer = opts?.parent ?? app.stage;

        const maskArea = new Rect({
            width: app.screen.width,
            height: app.screen.height,
            backColor: 0x000000,
            backAlpha: 0.5
        })
        super.addChild(maskArea)

        const scale = 0.8;

        const content = new Container();
        content.interactive = true;
        content.on('pointerdown', (e) => e.stopPropagation())
        const height = opts?.height ?? app.screen.height * scale * 0.8;
        this.content = content;

        const width = app.screen.width * scale;
        const back = new Rect({
            width: width,
            height: height,
            backAlpha: Modal.defaultAlpha,
            borderColor: opts?.border ?? Modal.defaultBorder,
            backColor: opts?.color ?? Modal.defaultColor,
            borderWidth: unit(8)
        })
        content.addChild(back)
        content.width = width
        content.height = height

        this.zIndex = 999

        content.zIndex = 1000

        const contentMask = this.contentMask = new Rect({
            width: width,
            height: height,
        })
        content.addChild(contentMask);
        content.mask = contentMask;

        super.addChild(content)
        align(content);

        this.interactive = true;

        this.on('pointerdown', () => {
            if (opts?.canClose) {
                this.close();
            }
        })
    }

    addChild(...children: DisplayObject[]) {
        return this.content.addChild(...children);
    }

    addExtra(...children: DisplayObject[]) {
        return super.addChild(...children);
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
