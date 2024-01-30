import {Command} from "commander";
import {pack} from "./webpack";

// export const build = {
//     command: "build [channel]",
//     description: "build project",
//     action: (channel: string) => {
//         pack({channel, prod: true})
//     }
// }


export const build = (cmd: Command) => {
    cmd.command('build')
        .description('Build project')
        .argument('<channel>', 'channel to build')
        .action((channel) => {
            pack({channel, prod: true})
        });
}
