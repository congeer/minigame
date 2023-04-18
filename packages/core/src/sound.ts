import {Assets} from "pixi.js";
import config from "./config";
import {root, wx} from "./wechat/wx";

const cache = {}

export function play(id: string, opts: { volume?: number, loop?: boolean, reset?: boolean } = {}) {
    if (config.platform === 'wechat') {
        if (cache[id]) {
            const sound = cache[id]
            sound.volume = opts.volume ?? 1
            opts.reset ??= true
            opts.reset && sound.stop()
            sound.play()
            return sound
        } else {
            const sound = cache[id] = wx.createInnerAudioContext({useWebAudioImplement: true})
            sound.volume = opts.volume ?? 1
            sound.src = `${root}/sound/${id}`
            sound.loop = opts.loop
            sound.autoplay = true
            return sound
        }
    } else {
        Assets.get(id).play(opts)
    }
}

export function pause(id: string) {
    if (config.platform === 'wechat') {
        const sound = cache[id]
        if (!sound) return
        !sound.paused && sound.pause()
    } else {
        Assets.get(id).pause()
    }
}
