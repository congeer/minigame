import {Align, align} from "@minigame/core";
import {Container as PIXIContainer, DisplayObject} from "pixi.js";


type ChildCache = {
    child: DisplayObject,
    parent?: Container | undefined,
    align?: Align
}

export class Container extends PIXIContainer {

    childrenCache: ChildCache[] = [];

    append(child: DisplayObject, parent?: Container | Align, alignOpt?: Align) {
        if (parent && !(parent instanceof Container)) {
            alignOpt = parent
            parent = undefined
        }
        this.addChild(child)
        if (!parent && !alignOpt) return
        this.childrenCache.push({child, parent, align: alignOpt})
        for (let i = this.childrenCache.length - 1; i >= 0; i--) {
            const {child, parent, align: opt} = this.childrenCache[i]
            align(child, parent, opt)
        }
    }

}
