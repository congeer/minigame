import {initRouter} from "@/router";
import {AdManager, config, createApp, eventBus, install, loader} from "@minigame/core";
import {Assets} from "pixi.js";
window.uiFont= 'Arial'
try {
    AdManager.init({})
    config.baseURL = `https://public.congeer.com/${PROJECT_NAME}${PROD ? '' : '-dev'}`
    config.version = VERSION
    install({scale: 9/16})
    createApp();
    initRouter();
    loader.reset();
    try {
        const version = await Assets.load(`${config.baseURL}/version/latest.json`);
        config.resource = version.version
        for (let i = 0; i < version.files.length; i++) {
            loader.load(version.files[i])
        }
    } catch (e) {
        console.warn("Don't have version file, use local version.");
    }
    await loader.result();
    eventBus.emit('loading', 100)
} catch (e) {
    console.error(e)
    eventBus.emit('error', e)
}
