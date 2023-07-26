import {Align, align} from "@minigame/core";
import {Container as PIXIContainer, DisplayObject} from "pixi.js";


export type ChildCache = {
    child: DisplayObject,
    parent?: PIXIContainer | undefined,
    align?: Align
}

export class Container extends PIXIContainer {

    childAlignCache: ChildCache[] = [];

    append(child: DisplayObject, parent?: Container | Align, alignOpt?: Align): DisplayObject {
        const ret = this.addChild(child);
        if (!parent && !alignOpt) return ret;
        if (parent && !(parent instanceof PIXIContainer)) {
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
