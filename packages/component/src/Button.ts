import {align, unit} from "@minigame/core";
import {Container, FederatedPointerEvent, ObservablePoint, Text, TextStyle} from "pixi.js";
import {Rect} from "./Rect";


type Options = {
    id?: string
    text?: string
    fontColor?: number
    fontStyle?: TextStyle
    backColor?: number
    backAlpha?: number
    borderWidth?: number
    borderColor?: number
    height?: number
    width?: number
    onClick?: () => void
}

export class Button extends Container {

    static defaultBackColor = 0
    static defaultBackAlpha = 0
    static defaultBorderColor = 0xffffff
    static defaultBorderWidth = 0

    opts: Options;

    constructor(opts?: Options) {
        super()
        this.opts = opts ?? {};
        if (!this.opts.text) {
            this.opts.text = "Button";
        }
        this.draw(this.opts);
    }

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    draw(opts: Options) {
        const style = opts.fontStyle ?? {
            fill: opts.fontColor ?? 0xffffff, fontSize: unit(60),
        };
        const text = new Text(opts.text, style);
        this.addChild(text)
        const background = new Rect({
            borderColor: opts.borderColor ?? Button.defaultBorderColor,
            borderWidth: opts.borderWidth ?? Button.defaultBorderWidth,
            backColor: opts.backColor ?? Button.defaultBackColor,
            backAlpha: opts.backAlpha ?? Button.defaultBackAlpha,
            width: opts.width ?? text.width + unit(30),
            height: opts.height ?? text.height + unit(30),
        });
        this.addChild(background)
        this.eventMode = 'static'
        align(text, this)
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }

    redraw(opts?: Options) {
        this.opts = {...this.opts, ...opts};
        this.removeChildren();
        this.removeAllListeners();
        this.draw(this.opts);
    }

    set text(text: string) {
        this.redraw({text})
    }

    set fontStyle(fontStyle: TextStyle) {
        this.redraw({fontStyle})
    }

    set backColor(backColor: number) {
        this.redraw({backColor})
    }

    set borderColor(borderColor: number) {
        this.redraw({borderColor})
    }

    set borderWidth(borderWidth: number) {
        this.redraw({borderWidth})
    }

    set backAlpha(backAlpha: number) {
        this.redraw({backAlpha})
    }

    set onClick(callback: (event: FederatedPointerEvent) => void) {
        this.on('pointerup', callback)
    }

    set buttonHeight(height: number) {
        this.redraw({height})
    }

    set buttonWidth(width: number) {
        this.redraw({width})
    }

}

