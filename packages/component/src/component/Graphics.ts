import {Align} from "@minigame/core";
import {DisplayObject, Graphics as PIXIGraphics, ObservablePoint} from "pixi.js";
import {AlignHolder} from "../utils/AlignHolder";

export class Graphics extends PIXIGraphics {

    alignHolder: AlignHolder;

    constructor() {
        super();
        this.alignHolder = new AlignHolder(this);
    }

    anchor = new ObservablePoint(() => {
        this.pivot.set(this.anchor.x * this.width, this.anchor.y * this.height);
    }, this, 0, 0);

    append(child: DisplayObject, parent?: DisplayObject | Align, alignOpt?: Align): DisplayObject {
        return this.alignHolder.append(child, parent, alignOpt);
    }

    removeChildren(beginIndex?: number, endIndex?: number): DisplayObject[] {
        const children = super.removeChildren(beginIndex, endIndex);
        children.forEach(displayObject => this.alignHolder.remove(displayObject));
        return children;
    }

    removeChild(...child: DisplayObject[]): DisplayObject {
        const one = super.removeChild(...child);
        this.alignHolder.remove(...child)
        return one;
    }

    align() {
        this.alignHolder.align();
    }

}
