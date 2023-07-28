import {Container} from "./Container";
import {Graphics} from "./Graphics";

export const minAlpha = 1e-10;
export const maxZIndex = 1e10;

export type Component = Container | Graphics;
