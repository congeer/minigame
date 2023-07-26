import {unit} from "@minigame/core";
import {FederatedPointerEvent, ObservablePoint, Text, TextStyle} from "pixi.js";
import {Rect, RectOptions} from "./Rect";


export type ButtonOptions = {
    id?: string
    text?: string
    fontColor?: number
    fontStyle?: Partial<TextStyle>
    onClick?: (event: FederatedPointerEvent) => void
} & RectOptions

export class Button extends Rect<ButtonOptions> {

    static defaultBackColor = 0
    static defaultBackAlpha = 0
    static defaultBorderColor = 0xffffff
    static defaultBorderWidth = 0

    textComponent: Text;

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
        this.opts.fontStyle = this.opts.fontStyle ?? {
            fill: this.opts.fontColor ?? 0xffffff, fontSize: unit(60),
        };
        this.textComponent = new Text(this.opts.text, this.opts.fontStyle);
        this.opts = {
            ...this.opts,
            width: this.opts.width ?? this.textComponent.width + unit(20),
            height: this.opts.height ?? this.textComponent.height + unit(20)
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
        if (this.textComponent) {
            this.append(this.textComponent, {center: 0, middle: 0})
        }
    }

    set text(text: string) {
        this.textComponent = new Text(text, this.opts.fontStyle);
        this.review({text})
    }

    set fontStyle(fontStyle: TextStyle) {
        this.textComponent = new Text(this.opts.text, fontStyle);
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

