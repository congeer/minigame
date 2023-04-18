import {Container, ObservablePoint, Sprite, Text} from "pixi.js";

type Option = {
    text?: string;

    style?: any;

    styles?: any;

    maxWidth?: number;
}

export class RichText extends Container {

    opts: Option;
    blocks: { tag: string, text: string }[];

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    constructor(opts?: Option) {
        super();
        this.opts = opts ?? {};
        if (opts.style && !opts.styles['default']) {
            opts.styles['default'] = opts.style;
        }
        if (!opts.text) {
            return;
        }
        this.handlerBlocks(opts);
        this.drawSelf(opts);
    }

    reDraw(opts: Option) {
        this.opts = {...this.opts, ...opts};
        this.removeChildren();
        this.handlerBlocks(this.opts);
        this.drawSelf(this.opts);
    }

    set text(value) {
        this.opts = {...this.opts, text: value};
        this.reDraw(this.opts);
    }

    set style(value) {
        this.opts.styles['default'] = value
        this.reDraw(this.opts);
    }

    set styles(value) {
        this.opts = {...this.opts, styles: value};
        this.reDraw(this.opts);
    }

    set maxWidth(value) {
        this.opts = {...this.opts, maxWidth: value};
        this.reDraw(this.opts);
    }

    handlerBlocks(opts) {
        const text = opts.text;
        const blocks = [] as { tag: string, text: string }[];
        let temp = "";

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

    customTagHandler(tag): { tag: string, text: string } | undefined {
        return;
    }

    protected drawSelf(opts: Option) {
        const size = opts.styles["default"].fontSize;
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
                this.addChild(new Container());
            } else if (tag === "sprite") {
                const sprite = Sprite.from(content);
                sprite.anchor.y = 0.4
                sprite.scale.set(Math.min(size * 1.2 / sprite.width, size * 1.2 / sprite.height));
                if (opts.maxWidth && x + sprite.width > opts.maxWidth) {
                    x = 0;
                    y += lineHeight;
                }
                sprite.x = x;
                sprite.y = y + lineHeight * 0.25;
                x += sprite.width - size / 20;
                this.addChild(sprite);
            } else {
                const styles = {...opts.styles['default'], ...opts.styles[tag]};
                const text = new Text(content, styles);
                text.anchor.y = 0.5
                let left = "";
                if (opts.maxWidth) {
                    if (content.length > 1 && (x + 1.2 * size) < opts.maxWidth) {
                        while ((x + text.width) > opts.maxWidth && content.length > 1) {
                            left = content.substring(content.length - 1) + left;
                            content = content.substring(0, content.length - 1);
                            text.text = content;
                        }
                    }
                    if (left) {
                        this.blocks.splice(i + 1, 0, {tag: tag, text: left});
                    }
                    if (x + text.width > opts.maxWidth) {
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
                this.addChild(text);
            }
        }
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }

}
