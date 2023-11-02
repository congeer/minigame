import {isScheduleLabel, resource, Schedule, scheduleLabel, World} from "@minigame/ecs";
import {App} from "./app";
import {Plugin} from './plugin';

@scheduleLabel
class PreStartupLabel {
}

@scheduleLabel
class StartupLabel {
}

@scheduleLabel
class PostStartupLabel {
}

@scheduleLabel
class FirstLabel {
}

@scheduleLabel
class PreUpdateLabel {
}

@scheduleLabel
class StateTransitionLabel {
}

@scheduleLabel
class RunFixedUpdateLoopLabel {
}

@scheduleLabel
class FixedUpdateLabel {
}

@scheduleLabel
class UpdateLabel {
}

@scheduleLabel
class PostUpdateLabel {
}

@scheduleLabel
class LastLabel {
}

export const PreStartup = new PreStartupLabel();
export const Startup = new StartupLabel();
export const PostStartup = new PostStartupLabel();
export const First = new FirstLabel();
export const PreUpdate = new PreUpdateLabel();
export const StateTransition = new StateTransitionLabel();
export const RunFixedUpdateLoop = new RunFixedUpdateLoopLabel();
export const FixedUpdate = new FixedUpdateLabel();
export const Update = new UpdateLabel();
export const PostUpdate = new PostUpdateLabel();
export const Last = new LastLabel();

@resource
export class MainScheduleOrder {
    labels: any[] = [
        First,
        PreUpdate,
        StateTransition,
        RunFixedUpdateLoop,
        Update,
        PostUpdate,
        Last
    ]

    insertAfter(after: any, schedule: any) {
        if (!isScheduleLabel(after) || !isScheduleLabel(schedule)) {
            throw new Error("Not a schedule label");
        }
        const find = this.labels.find(l => l.equals(after));
        const index = this.labels.indexOf(find);
        this.labels.splice(index + 1, 0, schedule);
    }

}

let runAtLeastOnce = false;

@scheduleLabel
class MainLabel {

    runMain(world: World) {
        if (!runAtLeastOnce) {
            world.runSchedule(PreStartup);
            world.runSchedule(Startup);
            world.runSchedule(PostStartup);
            runAtLeastOnce = true;
        }
        const order = world.resource(MainScheduleOrder);
        for (let label of order.labels) {
            world.runSchedule(label);
        }
    }
}

export const Main = new MainLabel();

export class MainSchedulePlugin extends Plugin {
    build(app: App): void {
        let mainSchedule = new Schedule();
        let fixedUpdateLoopSchedule = new Schedule();
        app.addSchedule(Main, mainSchedule)
            .addSchedule(RunFixedUpdateLoop, fixedUpdateLoopSchedule)
            .initResource(MainScheduleOrder)
            .addSystems(Main, Main.runMain);
    }

    name() {
        return "MainSchedulePlugin"
    }

}
