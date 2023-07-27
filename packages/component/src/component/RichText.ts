import {ObservablePoint, Sprite, Text} from "pixi.js";
import {Container} from "./Container";

export type RichTextOption = {
    text?: string;
    style?: any;
    styles?: any;
    maxWidth?: number;
}

const defaultOptions: RichTextOption = {
    text: '',
    styles: {},
}

export class RichText extends Container {

    opts: RichTextOption;
    blocks: { tag: string, text: string }[] = [];

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    constructor(opts?: RichTextOption) {
        super();
        this.opts = {...defaultOptions, ...opts};
        if (this.opts.style && !this.opts.styles['default']) {
            this.opts.styles['default'] = this.opts.style;
        }
        if (!this.opts.text) {
            return;
        }
        this.handlerBlocks();
        this.view();
    }

    review(opts?: RichTextOption) {
        this.opts = {...this.opts, ...opts};
        this.removeChildren();
        this.handlerBlocks();
        this.view();
    }

    set text(text: string) {
        this.opts = {...this.opts, text};
        this.review(this.opts);
    }

    set style(style: any) {
        this.opts.styles['default'] = style
        this.review(this.opts);
    }

    set styles(styles: any) {
        this.opts = {...this.opts, styles};
        this.review(this.opts);
    }

    set maxWidth(maxWidth: number) {
        this.opts = {...this.opts, maxWidth};
        this.review(this.opts);
    }

    handlerBlocks() {
        const text = this.opts.text;
        const blocks = [];
        let temp = "";

        if (!text) {
            return;
        }

        for (let i = 0; i < text.length; i++) {
            const t = text[i];
            if (t !== "<") {
                temp += t;
            } else if (t === "<") {
                if (temp) {
                    blocks.push({tag: "default", text: temp});
                    temp = "";
                }
                const end = text.indexOf(">", i);
                const tag = text.substring(i + 1, end);
                if (tag.startsWith("br") && tag.endsWith("/")) {
                    blocks.push({tag: "br", text: ""});
                    i = end;
                    continue;
                }
                if (tag.startsWith("sprite") && tag.endsWith("/")) {
                    const image = tag.substring(tag.indexOf("image") + 7, tag.length - 2);
                    blocks.push({tag: "sprite", text: image});
                    i = end;
                    continue;
                }
                const customTag = this.customTagHandler(tag);
                if (customTag) {
                    blocks.push(customTag)
                    i = end;
                    continue;
                }
                const tagEnd = text.indexOf("</" + tag + ">", end);
                const content = text.substring(end + 1, tagEnd);
                blocks.push({tag, text: content});
                i = tagEnd + tag.length + 2;
            }
        }
        if (temp) {
            blocks.push({tag: "default", text: temp});
        }
        this.blocks = blocks;
    }

    customTagHandler(tag: string): { tag: string, text: string } | undefined {
        return;
    }

    protected view() {
        const size = this.opts.styles["default"].fontSize;
        let x = 0;
        let y = size / 2;
        const lineHeight = 1.4 * size;
        for (let i = 0; i < this.blocks.length; i++) {
            const t = this.blocks[i];
            let content = t.text;
            const tag = t.tag;
            if (tag === "br") {
                x = 0;
                y += lineHeight;
                this.append(new Container());
            } else if (tag === "sprite") {
                const sprite = Sprite.from(content);
                sprite.anchor.y = 0.4
                sprite.scale.set(Math.min(size * 1.2 / sprite.width, size * 1.2 / sprite.height));
                if (this.opts.maxWidth && x + sprite.width > this.opts.maxWidth) {
                    x = 0;
                    y += lineHeight;
                }
                sprite.x = x;
                sprite.y = y + lineHeight * 0.25;
                x += sprite.width - size / 20;
                this.append(sprite);
            } else {
                const styles = {...this.opts.styles['default'], ...this.opts.styles[tag]};
                const text = new Text(content, styles);
                text.anchor.y = 0.5
                let left = "";
                if (this.opts.maxWidth) {
                    if (content.length > 1 && (x + 1.2 * size) < this.opts.maxWidth) {
                        while ((x + text.width) > this.opts.maxWidth && content.length > 1) {
                            left = content.substring(content.length - 1) + left;
                            content = content.substring(0, content.length - 1);
                            text.text = content;
                        }
                    }
                    if (left) {
                        this.blocks.splice(i + 1, 0, {tag: tag, text: left});
                    }
                    if (x + text.width > this.opts.maxWidth) {
                        x = 0;
                        y += lineHeight;
                    }
                }
                text.x = x;
                text.y = y + lineHeight * 0.25;
                x += text.width - size / 20;
                if (left) {
                    x = 0;
                    y += lineHeight;
                }
                this.append(text);
            }
        }
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }

}
