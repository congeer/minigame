import {Rect, Scene, ScrollContainer} from "@minigame/component";
import {config} from "@minigame/core";
import {Text} from "pixi.js";

class Main extends Scene {

    constructor() {
        super({color: 0});
    }

    view() {
        const scroll = new ScrollContainer({
            width: config.safeArea.width,
            height: config.safeArea.height,
            backAlpha: 1,
            backColor: 0xffffff,
            direction: "vertical",
            scroller: "auto",
        });
        this.append(scroll, {});
        for (let i = 0; i < 100; i++) {
            const rect = new Rect({
                width: 50,
                height: 50,
                backColor: 0xff0000,
            });
            rect.addChild(new Text(i))
            scroll.append(rect, {top: i * 60, left: i * 60});
        }
    }

}

export default Main;
