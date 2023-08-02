import minimist from 'minimist';
import {create} from "./create";
import {run} from "./webpack";

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
            case 'run':
                run.action({});
                break;
        }
    }
}
