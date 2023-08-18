import * as scene from "@/scene";
import {setting} from "@/store";
import {navigateTo, registerScenes, replaceScene} from "@minigame/component"
import {eventBus, pause, play, storeEvent} from "@minigame/core";


const playBGM = () => {
    storeEvent.on('setting', (target, key, value) => {
        if (key === 'backSound') {
            if (value) {
                play('bgm.mp3', {loop: true})
            } else {
                pause('bgm.mp3')
            }
        }
    })
    if (setting('backSound')) {
        play('bgm.mp3', {loop: true})
    }
};

export const initRouter = () => {
    registerScenes(scene as any)
    eventBus.on('loaded', () => {
        replaceScene('review')
        setTimeout(() => {
            replaceScene('menu')
            // playBGM();
        }, 1000)
    })
    navigateTo('preload')
}
