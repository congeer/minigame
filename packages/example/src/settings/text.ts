import {afterLoadFont, unit} from "@minigame/core";
import {ITextStyle, TextStyle} from "pixi.js";

const textStyle: Partial<ITextStyle> = {
    fontSize: unit(50),
    fill: 0xffffff,
    strokeThickness: unit(10),
}

const uiStyle: Partial<ITextStyle> = {
    fontSize: unit(60),
    fill: 0xffffff,
    strokeThickness: unit(12),
}

afterLoadFont((name, font) => {
    if (name === 'ui-font') {
        uiStyle['fontFamily'] = font
        TextStyle.defaultStyle.fontFamily = font;
        window.uiFont = font;
    }
    if (name === "text-font") {
        textStyle['fontFamily'] = font
        window.font = font;
    }
})

const ts = (styles: Partial<ITextStyle>) => {
    if (styles.fontSize) {
        styles.strokeThickness = styles.fontSize as number * 0.2
    }

    return {
        ...textStyle,
        ...styles
    }
}

const us = (styles: Partial<ITextStyle>) => {
    if (styles.fontSize) {
        styles.strokeThickness = styles.fontSize as number * 0.2
    }

    return {
        ...uiStyle,
        ...styles
    }
}


export {
    ts,
    us,
    textStyle,
    uiStyle
}
