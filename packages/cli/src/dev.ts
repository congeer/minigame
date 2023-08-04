import {pack} from "./webpack";

export const dev = {
    command: "dev [channel]",
    description: "development project",
    action: (channel: string) => {
        pack({channel, prod: false})
    }
}
