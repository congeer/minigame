import {App, HierarchyEntityData, Plugin} from "@minigame/app";
import {CommandEnhance, component, resource, World} from "@minigame/ecs";
import {Container, IRendererOptions, Rectangle, Renderer, Ticker, UPDATE_PRIORITY} from "pixi.js";
import {config} from "./config";

// function runTicker(app: App) {
//     while (!app.ready()) {
//
//     }
//     app.finish();
//     app.cleanup();
//
//     const update = () => {
//         app.update();
//         requestAnimationFrame(() => update());
//     }
//     update();
// }

@resource
export class PixiApp {
    renderer: Renderer
    stage: Container
    ticker: Ticker
    screen: Rectangle

    constructor(opts?: Partial<IRendererOptions>) {
        this.stage = new Container();
        this.renderer = new Renderer({
            view: config.adapter.getCanvas(),
            autoDensity: true,
            antialias: true,
            resolution: devicePixelRatio,
            backgroundColor: 0,
            width: innerWidth,
            height: innerHeight,
            ...opts
        })
        this.screen = this.renderer.screen;
        this.ticker = Ticker.shared;
        this.ticker.add(() => {
            this.renderer.render(this.stage)
        }, null, UPDATE_PRIORITY.UTILITY);
    }
}

@component
export class PIXIContainer {

    container: Container

    constructor() {
        this.container = new Container();
    }

}

const spawnEnhance: CommandEnhance = {
    key: "spawn",
    before: (world: World, ...args: any[]) => {

    },
    after: (world: World, ret: HierarchyEntityData) => {
        const container = ret.get(PIXIContainer);
        if (container) {
            world.resource(PixiApp).stage.addChild(container.container);
        }
        return ret;
    }
}

export class DefaultPixiJSPlugin extends Plugin {

    opts: Partial<IRendererOptions> = {}

    constructor(opts: Partial<IRendererOptions> = {}) {
        super()
        this.opts = opts
    }

    build(app: App) {
        let _app = new PixiApp(this.opts);
        app.insertResource(_app);
        app.enhanceCommand(spawnEnhance);
        app.setRunner((app: App) => {
            while (!app.ready()) {
            }
            app.finish();
            app.cleanup();
            _app.ticker.add(() => {
                app.update();
            })
        })
    }

    name(): string {
        return "DefaultPixiJSPlugin";
    }

}
