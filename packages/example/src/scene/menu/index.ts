import color, {blockColor} from "@/settings/color";
import {us} from "@/settings/text";
import {isInGame, resetGame} from "@/store";
import {Button, Container, Modal, navigateTo, RichText, Scene} from "@minigame/component";
import {i18n, unit} from "@minigame/core";
import {Graphics} from "pixi.js";

const prefix = "ui.menu";

class Menu extends Scene {

    view() {
        const content = new Container();
        const title = new RichText({
            text: i18n.t("ui.title"),
            style: us({fontSize: unit(65)})
        })
        content.append(title, {top: 0})

        let y = title.y + title.height + unit(100);

        let continueBtn: Button | undefined = undefined;
        if (isInGame()) {
            continueBtn = new Button({
                text: i18n.t(`${prefix}.continueBtn`, {defaultValue: "Continue"}),
            });
            continueBtn.onClick = () => {
                navigateTo("main")
            }
            content.append(continueBtn, {top: y});
            y += continueBtn!.height + unit(50);
        }

        const newGameBtn = new Button({
            text: i18n.t(`${prefix}.newGameBtn`, {defaultValue: "New Game"}),
            borderColor: color.green,
            round: unit(15),
        });
        newGameBtn.onClick = () => {
            resetGame();
            navigateTo("main");
        }
        content.append(newGameBtn, {top: y})
        y += newGameBtn.height + unit(50);

        const settingBtn = new Button({
            text: i18n.t(`${prefix}.settingsBtn`, {defaultValue: "Settings"}),
            borderColor: color.white,
            round: unit(15),
        });
        settingBtn.onClick = () => navigateTo("settings")
        content.append(settingBtn, {top: y})

        const block = new Graphics();
        block.beginFill(blockColor, 0.8)
        block.drawRect(0, 0, content.width + unit(200), content.height + unit(200))
        block.endFill();
        block.zIndex = -1;
        this.append(block, {});
        this.append(content, {})
        new Modal({canClose: true, relative: this}).open();
    }

}

export default Menu;
