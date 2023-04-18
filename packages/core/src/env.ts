import '@pixi/sound'
import '@pixi/unsafe-eval'

import {Container, extensions, PRECISION, Program} from "pixi.js";

import {i18nParser, luaParser} from "./parser";

Container.defaultSortableChildren = true
Program.defaultFragmentPrecision = PRECISION.HIGH
Program.defaultVertexPrecision = PRECISION.HIGH

extensions.add(luaParser)
extensions.add(i18nParser)
