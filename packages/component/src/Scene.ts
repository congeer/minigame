import {app} from "@minigame/core";
import {Container} from "pixi.js";
import {Rect} from "./Rect";


type BackGroundProps = {
    color?: number
}

export class Scene extends Container {

    static defaultColor = 0x000000

    constructor(opts?: BackGroundProps) {
        super();
        const background = new Rect({
            width: app.screen.width,
            height: app.screen.height,
            backColor: opts?.color ?? Scene.defaultColor,
            zIndex: -1
        });
        this.addChild(background);
        app.stage.addChild(this)
    }

    set color(color: number) {
        const background = this.children[0] as Rect;
        background.backColor = color;
    }

    reset() {
        if (this.children.length > 1) {
            this.removeChildren(1)
        }
    }

    destroy() {
        this.hide();
        app.stage.removeChild(this);
    }

    draw() {
    }

    show(...args: any[]) {
        this.reset();
        this.visible = true;
        this.draw();
    }

    hide() {
        this.visible = false;
        this.reset();
    }

}
