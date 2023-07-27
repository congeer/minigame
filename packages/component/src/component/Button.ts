import {unit} from "@minigame/core";
import {FederatedPointerEvent, Text, TextStyle} from "pixi.js";
import {Rect, RectOptions} from "./Rect";


export type ButtonOptions = {
    id?: string
    text?: string
    fontColor?: number
    fontStyle?: Partial<TextStyle>
    padding?: number
    onClick?: (event: FederatedPointerEvent) => void
} & RectOptions

export class Button extends Rect<ButtonOptions> {

    static defaultBackColor = 0
    static defaultBackAlpha = 0
    static defaultBorderColor = 0xffffff
    static defaultBorderWidth = 0
    static defaultPadding = unit(25)

    constructor(opts?: ButtonOptions) {
        super({
            borderColor: Button.defaultBorderColor,
            borderWidth: Button.defaultBorderWidth,
            backColor: Button.defaultBackColor,
            backAlpha: Button.defaultBackAlpha,
            text: opts?.text,
            padding: Button.defaultPadding,
            ...opts
        })
        if (!this.opts.text) {
            this.opts.text = "Button";
        }
        this.opts.fontStyle = this.opts.fontStyle ?? {
            fill: this.opts.fontColor ?? 0xffffff, fontSize: unit(60),
        };
        this.view();
        this.redraw();
    }

    protected view() {
        const text = new Text(this.opts.text, this.opts.fontStyle);
        this.opts = {
            ...this.opts,
            width: this.opts.width ?? text.width + this.opts.padding!,
            height: this.opts.height ?? text.height + this.opts.padding!
        }
        this.eventMode = 'static';
        if (this.opts.onClick) {
            this.on('pointerup', this.opts.onClick)
        }
        this.append(text, {})
    }

    redraw(opts?: ButtonOptions) {
        super.redraw(opts);
        this.view();
    }

    set text(text: string) {
        this.redraw({text})
    }

    set fontStyle(fontStyle: TextStyle) {
        this.redraw({fontStyle: {...this.opts.fontStyle, ...fontStyle}})
    }

    set onClick(callback: (event: FederatedPointerEvent) => void) {
        this.opts.onClick = callback;
        this.on('pointerup', callback)
    }

    set buttonHeight(height: number) {
        this.redraw({height})
    }

    set buttonWidth(width: number) {
        this.redraw({width})
    }

}

