import {unit} from "@minigame/core";
import {FederatedPointerEvent, ObservablePoint, Text, TextStyle} from "pixi.js";
import {Rect, RectOptions} from "./Rect";


export type ButtonOptions = {
    id?: string
    text?: string
    fontColor?: number
    fontStyle?: TextStyle
    onClick?: (event: FederatedPointerEvent) => void
} & RectOptions

export class Button extends Rect<ButtonOptions> {

    static defaultBackColor = 0
    static defaultBackAlpha = 0
    static defaultBorderColor = 0xffffff
    static defaultBorderWidth = 0

    constructor(opts?: ButtonOptions) {
        super({
            borderColor: Button.defaultBorderColor,
            borderWidth: Button.defaultBorderWidth,
            backColor: Button.defaultBackColor,
            backAlpha: Button.defaultBackAlpha,
            text: opts?.text,
            ...opts
        })
        if (!this.opts.text) {
            this.opts.text = "Button";
        }
    }

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    protected doView() {
        super.doView();
        this.eventMode = 'static';
        if (this.opts.onClick) {
            this.on('pointerup', this.opts.onClick)
        }
        const style = this.opts.fontStyle ?? {
            fill: this.opts.fontColor ?? 0xffffff, fontSize: unit(60),
        };

        const text = new Text(this.opts.text, style);

        this.width = this.opts.width ?? text.width + unit(20);
        this.height = this.opts.height ?? text.height + unit(20);

        this.append(text, {center: 0, middle: 0})
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }

    set text(text: string) {
        this.review({text})
    }

    set fontStyle(fontStyle: TextStyle) {
        this.review({fontStyle})
    }

    set onClick(callback: (event: FederatedPointerEvent) => void) {
        this.opts.onClick = callback;
        this.on('pointerup', callback)
    }

    set buttonHeight(height: number) {
        this.review({height})
    }

    set buttonWidth(width: number) {
        this.review({width})
    }

}

