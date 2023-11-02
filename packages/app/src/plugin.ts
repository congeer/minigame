import {App} from "./app";

export abstract class Plugin {

    abstract build(app: App): void;

    ready(app: App): boolean {
        return true;
    }

    finish(app: App) {

    }

    cleanup(app: App) {

    }

    abstract name(): string;

    isUnique(): boolean {
        return true;
    }

}
