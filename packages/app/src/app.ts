import {
    applyStateTransition, CommandEnhance,
    CommandRegister,
    enumerate,
    matchType,
    runEnterSchedule,
    runOnce,
    Schedule,
    Schedules,
    State,
    States,
    System,
    SystemConfig,
    World
} from "@minigame/ecs";
import {HierarchyPlugin} from "./hierarchy";
import {Main, MainSchedulePlugin, StateTransition} from "./main_schedule";
import {Plugins} from "./plugins";

function runAppOnce(app: App) {
    while (!app.ready()) {

    }
    app.finish();
    app.cleanup();
    app.update();
}

export class App {

    #plugins: Plugins = new Plugins();

    world: World = new World();

    mainScheduleLabel: any;

    runner: any;

    constructor(mainScheduleLabel: any, runner: any) {
        this.mainScheduleLabel = mainScheduleLabel;
        this.runner = runner;
    }

    static new() {
        return new App(Main, runAppOnce);
    }

    static default() {
        const app = new App(Main, runAppOnce);
        app.addPlugins(MainSchedulePlugin, HierarchyPlugin)
        return app;
    }

    run() {
        this.runner(this)
    }

    setRunner(runner: any) {
        this.runner = runner;
        return this;
    }

    addSystems(type: any, ...systems: (System | SystemConfig)[]): App {
        let schedules: Schedules = this.world.resource(Schedules);
        if (!schedules) {
            throw new Error("No schedules, try create app with new()");
        }
        let schedule = schedules.get(type);
        if (!schedule) {
            schedules.insert(type, new Schedule(...systems));
        } else {
            schedule.addSystems(...systems);
        }
        return this;
    }

    addSchedule(label: any, schedule: Schedule) {
        this.world.addSchedule(label, schedule);
        return this;
    }

    registerCommand(command: CommandRegister) {
        this.world.registerCommand(command);
        return this;
    }

    replaceCommand(command: CommandRegister) {
        this.world.replaceCommand(command);
        return this;
    }

    enhanceCommand(command: CommandEnhance) {
        this.world.enhanceCommand(command);
        return this;
    }

    addState(states: any): App {
        matchType(states, States)
        enumerate(states)
        const state = State.for(states);
        this.insertResource(new state(states))
            .addSystems(StateTransition, SystemConfig.new(runEnterSchedule(states)).runIf(runOnce()), applyStateTransition(states))
        return this;
    }

    addPlugins(...plugins: any[]): App {
        for (let plugin of plugins) {
            if (typeof plugin === "function") {
                plugin = new plugin();
            }
            if (plugin.isUnique() && this.#plugins.pluginNames.indexOf(plugin.name()) !== -1) {
                throw new Error(plugin.name() + " is duplicate.");
            }
            console.log(`added plugin: ${plugin.name()}`);
            this.#plugins.addPlugin(plugin);
            plugin.build(this)
        }
        return this;
    }

    initResource(res: any): App {
        this.world.initResource(res);
        return this;
    }

    insertResource(res: any): App {
        this.world.insertResource(res);
        return this;
    }

    ready() {
        for (let plugin of this.#plugins.plugins) {
            if (!plugin.ready(this)) {
                return false;
            }
        }
        return true;
    }

    finish() {
        for (let plugin of this.#plugins.plugins) {
            plugin.finish(this)
        }
    }

    cleanup() {
        for (let plugin of this.#plugins.plugins) {
            plugin.cleanup(this)
        }
    }

    update() {
        this.world.runSchedule(this.mainScheduleLabel);
    }

}
