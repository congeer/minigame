import {createStore, Store} from "@minigame/core";

let store: Store;
export const initStore = (info: Store) => {
    store = createStore(info, PROJECT_NAME)
}

let init: Store = {__type__: 'root'}

try {
    const s = localStorage.getItem(PROJECT_NAME);
    if (s) {
        init = JSON.parse(s) ?? init
    }
} catch {
}

initStore(init)
const defaultGame = () => {
    return {
        __type__: 'game',
        phase: -1,
    }
};

const defaultSetting = {
    __type__: 'setting',
    multiplier: 1,
    backSound: true,
    effectSound: true,
};

export const resetGame = () => {
    store.game = defaultGame();
}

export const isInGame = () => {
    return game('phase') !== undefined && game('phase') !== -1
}

export const setting = (key?: string, value?: any) => {
    if (!store.setting) {
        store.setting = defaultSetting;
    }
    const setting = store.setting;
    if (!key) {
        return setting;
    }
    if (value != undefined) {
        setting[key] = value;
    }
    return setting[key]
}

export const game = (key?: string, value?: any) => {
    if (!store.game) {
        store.game = defaultGame();
    }
    let game = store.game;
    if (!key) {
        return game;
    }
    if (value != undefined) {
        game[key] = value;
    }
    return game[key]
}

export {
    store
}
