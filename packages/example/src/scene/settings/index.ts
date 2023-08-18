import color from "@/settings/color";
import {uiStyle, us} from "@/settings/text";
import {setting} from "@/store";
import {Container, Rect, Scene} from "@minigame/component";
import {align, config, unit} from "@minigame/core";
import {Text} from "pixi.js";

class Settings extends Scene {

    view() {
        const content = new Container();

        content.addChild(new Rect({
            width: config.safeArea.width * 0.7,
            height: unit(850),
            backColor: color.blockColor,
            backAlpha: 0.7
        }))

        const margin = unit(40);

        let y = margin;

        let switchSize = unit(120);

        const language = new Text('语言', uiStyle);
        content.addChild(language);
        align(language, content, {top: y, left: margin});

        const languageSwitch = new Text('中文', uiStyle);
        content.addChild(languageSwitch);
        align(languageSwitch, content, {top: y, right: margin});


        y += switchSize;


        const backSound = new Text('音乐', uiStyle);
        content.addChild(backSound);
        align(backSound, content, {top: y, left: margin});


        const backSoundOn = new Text('开', us({fill: setting('backSound') ? color.green : color.white}));
        content.addChild(backSoundOn);
        align(backSoundOn, content, {top: y, right: switchSize + margin});
        backSoundOn.interactive = true;
        backSoundOn.on('pointerdown', () => {
            setting('backSound', true);
            backSoundOn.style = us({fill: color.green});
            backSoundOff.style = us({fill: color.white});
        })

        const backSoundOff = new Text('关', us({fill: setting('backSound') ? color.white : color.green}));
        content.addChild(backSoundOff);
        align(backSoundOff, content, {top: y, right: margin});
        backSoundOff.interactive = true;
        backSoundOff.on('pointerdown', () => {
            setting('backSound', false);
            backSoundOn.style = us({fill: color.white});
            backSoundOff.style = us({fill: color.green});
        });

        y += switchSize;

        const effectSound = new Text('音效', uiStyle);
        content.addChild(effectSound);
        align(effectSound, content, {top: y, left: margin});

        const effectSoundOn = new Text('开', us({fill: setting('effectSound') ? color.green : color.white}));
        content.addChild(effectSoundOn);
        align(effectSoundOn, content, {top: y, right: switchSize + margin});
        effectSoundOn.interactive = true;
        effectSoundOn.on('pointerdown', () => {
            setting('effectSound', true);
            effectSoundOn.style = us({fill: color.green});
            effectSoundOff.style = us({fill: color.white});
        })

        const effectSoundOff = new Text('关', us({fill: setting('effectSound') ? color.white : color.green}));
        content.addChild(effectSoundOff);
        align(effectSoundOff, content, {top: y, right: margin});
        effectSoundOff.interactive = true;
        effectSoundOff.on('pointerdown', () => {
            setting('effectSound', false);
            effectSoundOn.style = us({fill: color.white});
            effectSoundOff.style = us({fill: color.green});
        });


        y += switchSize;

        const multi = new Text('倍速', uiStyle);
        content.addChild(multi);
        align(multi, content, {top: y, left: margin});

        const multiplier = setting('multiplier');
        const multiText8 = new Text('∞', us({fill: multiplier === 0 ? color.green : color.white}));
        content.addChild(multiText8);
        align(multiText8, content, {top: y, right: switchSize * 3 + margin});
        multiText8.interactive = true;
        multiText8.on('pointerdown', () => changeMulti(0));


        const multiText1 = new Text('×1', us({fill: multiplier === 1 ? color.green : color.white}));
        content.addChild(multiText1);
        align(multiText1, content, {top: y, right: switchSize * 2 + margin});
        multiText1.interactive = true;
        multiText1.on('pointerdown', () => changeMulti(1));


        const multiText2 = new Text('×2', us({fill: multiplier === 2 ? color.green : color.white}));
        content.addChild(multiText2);
        align(multiText2, content, {top: y, right: switchSize + margin});
        multiText2.interactive = true;
        multiText2.on('pointerdown', () => changeMulti(2));


        const multiText4 = new Text('×4', us({fill: multiplier === 4 ? color.green : color.white}));
        content.addChild(multiText4);
        align(multiText4, content, {top: y, right: margin});
        multiText4.interactive = true;
        multiText4.on('pointerdown', () => changeMulti(4));

        const changeMulti = (multi: number) => {
            setting('multiplier', multi);
            multiText1.style.fill = multi === 1 ? color.green : color.white;
            multiText2.style.fill = multi === 2 ? color.green : color.white;
            multiText4.style.fill = multi === 4 ? color.green : color.white;
            multiText8.style.fill = multi === 0 ? color.green : color.white;
        }


        const gameVersion = new Text('游戏版本', uiStyle);
        content.addChild(gameVersion);
        align(gameVersion, content, {bottom: switchSize + margin, left: margin});

        const gameVersionText = new Text(config.version, uiStyle);
        content.addChild(gameVersionText);
        align(gameVersionText, content, {bottom: switchSize + margin, right: margin});


        const resVersion = new Text('资源版本', uiStyle);
        content.addChild(resVersion);
        align(resVersion, content, {bottom: margin, left: margin});

        const resVersionText = new Text(config.resource, uiStyle);
        content.addChild(resVersionText);
        align(resVersionText, content, {bottom: margin, right: margin});

        this.append(content, {});
    }

}

export default Settings;
