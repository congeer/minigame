import minimist from 'minimist';
import {build} from "./build";
import {create} from "./create";
import {dev} from "./dev";

import {update} from "./update";

export default {
    run: (argv: string[]) => {
        const data = minimist(argv.slice(2));
        const command = data._[0];
        const args = data._.slice(1);
        switch (command) {
            case 'create':
                create.action(args[0]);
                break;
            case 'update':
                update.action(args[0]);
                break;
            case 'dev':
                dev.action(args[0]);
                break;
            case 'build':
                build.action(args[0]);
                break;
        }
    }
}
