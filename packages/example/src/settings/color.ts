import {Button, Scene} from "@minigame/component";
import {unite} from "@minigame/core";

const white = 0xFFFFFF

const black = 0x000000

const green = 0x66EE66

const red = 0xff0000

const blue = 0x6666ee

// export const bgColor = 0x7bbc4a
// export const bgColor = 0xFA8C35;
export const bgColor = 0xffffff;

// export const blockColor = 0xc5d843
export const blockColor = 0x333333

export const borderColor = 0xffe949

export const minAlpha = 0.00000001;

const Blue = 0x41a8f5
const Pink = 0xf75897
const Yellow = 0xfad388

Scene.defaultColor = bgColor
Button.defaultBorderColor = borderColor
Button.defaultBorderWidth = unite(4)
// Modal.defaultBorderColor = borderColor

export default {
    white,
    black,
    green,
    red,
    blue,
    bgColor,
    blockColor
}
