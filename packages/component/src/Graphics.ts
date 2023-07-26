import {align, Align} from "@minigame/core";
import {Container, DisplayObject, Graphics as PIXIGraphics} from "pixi.js";
import {ChildCache} from "./Container";

export class Graphics extends PIXIGraphics {

    childAlignCache: ChildCache[] = [];

    append(child: DisplayObject, parent?: Container | Align, alignOpt?: Align): DisplayObject {
        const ret = this.addChild(child);
        if (!parent && !alignOpt) return ret;
        if (parent && !(parent instanceof Container)) {
            alignOpt = parent;
            parent = this;
        }
        this.childAlignCache.push({child, parent, align: alignOpt});
        this.childAlignCache.forEach(({child, parent, align: opt}) => {
            align(child, parent, opt);
        })
        return ret;
    }

}
