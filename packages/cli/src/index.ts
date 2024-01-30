import {Command} from 'commander';
import {build} from "./build";
import {dev} from "./dev";

export default {
    run: (argv: string[]) => {
        const program = new Command();
        program
            .name('minigame-cli')
            .description('Minigame Cli')
            .version('0.2.0');

        build(program);
        dev(program);

        program.parse(argv);
    }
}
