import {Container, Scene} from "@minigame/component";
import {i18n, unit} from "@minigame/core";
import {Text} from "pixi.js";



class Review extends Scene {

    constructor() {
        super({color: 0});
    }

    view() {
        const content = new Container();
        const title = new Text(i18n.t("ui.review.title"), {
            fill: 0xffffff,
            fontFamily: window?.uiFont,
            fontSize: unit(80)
        });
        content.append(title, {top: 0});
        const text = new Text(i18n.t("ui.review.content"),
            {
                fill: 0xffffff,
                fontSize: unit(66),
                fontFamily: window?.uiFont
            }
        );
        content.append(text, {top: title.height});
        this.append(content, {});
    }

}

export default Review;
