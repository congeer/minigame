import {unit} from "@minigame/core";
import {FederatedPointerEvent, Text, TextStyle} from "pixi.js";
import {Rect, RectOptions} from "./Rect";


export type ButtonOptions = {
    id?: string
    text?: string
    textStyle?: Partial<TextStyle>
    padding?: number
    onClick?: (event: FederatedPointerEvent) => void
} & RectOptions

export class Button extends Rect<ButtonOptions> {

    static defaultBackColor = 0
    static defaultBackAlpha = 0
    static defaultBorderColor = 0xffffff
    static defaultBorderWidth = 0
    static defaultPadding = unit(25)
    static defaultTextStyle = {
        fill: 0xffffff,
        fontSize: unit(50)
    }

    constructor(opts?: ButtonOptions) {
        super({
            borderColor: Button.defaultBorderColor,
            borderWidth: Button.defaultBorderWidth,
            backColor: Button.defaultBackColor,
            backAlpha: Button.defaultBackAlpha,
            padding: Button.defaultPadding,
            ...opts,
            textStyle: {
                ...Button.defaultTextStyle,
                ...opts?.textStyle
            },
        })
    }

    protected drawer() {
        const text = new Text(this.opts.text, this.opts.textStyle);
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
        this.removeChildren();
        this.removeAllListeners();
        super.redraw(opts);
    }

    set text(text: string) {
        this.redraw({text})
    }

    set fontStyle(fontStyle: TextStyle) {
        this.redraw({textStyle: {...this.opts.textStyle, ...fontStyle}})
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
