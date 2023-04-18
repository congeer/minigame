import {utils} from "pixi.js";
import {app} from "./core";

export const eventBus = new utils.EventEmitter()

window.addEventListener("mousewheel", (event: any) => {
    let currentTarget = null;
    const findTarget = (target, event) => {
        if (target.hitArea && target.hitArea.contains(event.x, event.y) && target.onwheel) {
            return target;
        } else {
            for (let i = 0; i < target.children.length; i++) {
                const t = findTarget(target.children[i], event);
                if (t) {
                    return t;
                }
            }
        }
        return null;
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
