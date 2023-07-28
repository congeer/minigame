import {Container, DisplayObject, utils} from "pixi.js";
import {app} from "./core";

export const eventBus = new utils.EventEmitter()

type FindTarget = (target: DisplayObject, event: any) => (DisplayObject | undefined);

window.addEventListener("mousewheel", (event: any) => {
    let currentTarget = null;
    let findTarget: FindTarget = (target, event) => {
        if (target.hitArea && target.hitArea.contains(event.x, event.y) && target.onwheel) {
            return target;
        } else {
            if (!(target instanceof Container)) {
                return;
            }
            for (let i = 0; i < target.children.length; i++) {
                const t = findTarget(target.children[i], event);
                if (t) {
                    return t;
                }
            }
        }
        return;
    };

    for (let i = 0; i < app.stage.children.length; i++) {
        const t = findTarget(app.stage.children[i], event);
        if (t) {
            currentTarget = t;
            break;
        }
    }
    if (currentTarget && currentTarget.onwheel) {
        currentTarget.onwheel(event)
    }
})
