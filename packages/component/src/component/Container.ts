import {Align} from "@minigame/core";
import {Container as PIXIContainer, DisplayObject} from "pixi.js";
import {AlignHolder} from "../utils/AlignHolder";

export class Container extends PIXIContainer {

    alignHolder: AlignHolder;

    constructor() {
        super();
        this.alignHolder = new AlignHolder(this);
    }

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
        child.forEach(displayObject => this.alignHolder.remove(displayObject));
        return one;
    }

    align() {
        this.alignHolder.align();
    }

}
