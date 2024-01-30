import {Command} from "commander";
import {pack} from "./webpack";


export const dev = (cmd: Command) => {
    cmd.command('dev')
        .description('Development project')
        .argument('<channel>', 'channel to dev')
        .action((channel) => {
            pack({channel, prod: false})
        });
}
