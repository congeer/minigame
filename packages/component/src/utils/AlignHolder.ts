import {align, Align} from "@minigame/core";
import {Container as PIXIContainer, DisplayObject} from "pixi.js";

export type ChildCache = {
    child: DisplayObject,
    parent?: PIXIContainer | undefined,
    align?: Align
}

export class AlignHolder {

    base: PIXIContainer;

    constructor(base: PIXIContainer) {
        this.base = base;
    }

    childAlignCache: ChildCache[] = [];

    append(child: DisplayObject, parent?: PIXIContainer | Align, alignOpt?: Align): DisplayObject {
        const ret = this.base.addChild(child);
        if (!parent && !alignOpt) return ret;
        if (parent && !(parent instanceof PIXIContainer)) {
            alignOpt = parent;
            parent = this.base;
        }
        this.childAlignCache.push({child, parent, align: alignOpt});
        this.align();
        return ret;
    }

    remove(...child: DisplayObject[]) {
        this.childAlignCache = this.childAlignCache.filter(({child: c}) => !child.includes(c));
    }

    align() {
        this.childAlignCache.forEach(({child, parent, align: opt}) => {
            align(child, parent, opt);
        })
    }
}
