import {Plugin} from "./plugin";

export class Plugins {
    plugins: Plugin[] = [];

    pluginNames: string[] = [];

    addPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
        this.pluginNames.push(plugin.name());
    }

}

