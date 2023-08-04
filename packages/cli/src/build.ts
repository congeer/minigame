import {pack} from "./webpack";

export const build = {
    command: "build [channel]",
    description: "build project",
    action: (channel: string) => {
        pack({channel, prod: true})
    }
}
