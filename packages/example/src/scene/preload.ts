import {Scene} from "@minigame/component";
import {app, eventBus, i18n, loader, unit} from "@minigame/core";
import {Text} from "pixi.js";

export class Preload extends Scene {
    tick: (() => void) | undefined;
    loaded: boolean = false;

    constructor() {
        super({color: 0})
    }

    view() {
        const style = {
            fill: 0xffffff,
            fontSize: unit(90),
            fontFamily: window?.uiFont ?? '',
        };
        const title = new Text(i18n.t("ui.loading"), style);


        this.append(title, {middle: -title.height / 2});
        const fileNum = new Text("0/0", style);
        this.append(fileNum, {middle: fileNum.height / 2});

        eventBus.on("loading", (process) => {
            if (process == 100) {
                this.loaded = true
            }
        })
        eventBus.on("error", (err) => {
            this.tick && app.ticker.remove(this.tick)
            title.text = err
            title.style.fontSize = unit(30)
            this.align();
        })
        const start = new Date().getTime() / 500;
        this.tick = () => {
            let text = i18n.t("ui.loading")
            const time = new Date().getTime() / 500;
            for (let i = 0; i < time % 3; i++) {
                text += '.'
            }
            title.text = text
            title.style.fontFamily = window?.uiFont ?? '';
            let num = loader.fileList.length;
            fileNum.text = `${loader.fileLoaded}/${num}`
            fileNum.style.fontFamily = window?.uiFont ?? '';
            this.align()

            if (this.loaded && time - start > 1) {
                eventBus.emit("loaded")
            }
        }
        app.ticker.add(this.tick)

        return () => {
            this.tick && app.ticker.remove(this.tick)
        }
    }

}

export default Preload;
