import './env';

export {default as config, Platform} from "./config";

export {install, afterLoadFont} from "./config";

export {default as loader} from "./assets";

export {app, createApp} from "./core";

export {play, pause} from './sound'

export {createStore, storeEvent} from "./store";

export {eventBus} from "./event";

export {unit, align, spriteSize, createPromise} from "./utils";

export {isWechat} from "./wechat/wx"

export {loadLua, afterLoadLua} from "./parser/lua"

export {i18n} from './parser/i18n'
