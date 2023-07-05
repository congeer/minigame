import './env';

export {default as config} from "./config";

export {install, afterLoadFont} from "./config";

export {default as loader} from "./assets";

export {app, createApp} from "./core";

export {play, pause} from './sound'

export {createStore, storeEvent} from "./store";

export {eventBus} from "./event";

export {default as ShareManager} from "./share";

export {unit, align, alignGlobal, spriteSize, createPromise} from "./utils";

export {isWechat} from "./wechat"

export {loadLua, afterLoadLua, i18n} from "./parser"
