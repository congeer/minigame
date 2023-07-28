import {Scene} from "../component";

const sceneMap: { [key: string]: new () => Scene } = {}

const stack: { cursor: Scene, args: any[] }[] = []

export const registerScene = (name: string, scene: new <T extends Scene>() => T) => {
    sceneMap[name] = scene
}

export const registerScenes = (scenes: { [key: string]: new <T extends Scene>() => T }) => {
    Object.assign(sceneMap, scenes)
}

export const navigateTo = (name: string, ...args: any[]) => {
    const constructor = sceneMap[name]
    if (constructor) {
        const cursor = new constructor();
        stack[stack.length - 1]?.cursor.hide()
        cursor.show(...args)
        stack.push({cursor, args})
    }
}

export const replaceScene = (name: string, ...args: any[]) => {
    const constructor = sceneMap[name]
    if (constructor) {
        const pop = stack.pop();
        if (pop) {
            const pre = pop.cursor;
            pre.destroy();
        }
        const cursor = new constructor();
        stack[stack.length - 1]?.cursor.hide()
        cursor.show(...args)
        stack.push({cursor, args})
    }
}

export const navigateBack = () => {
    if (stack.length < 2) return
    const pre = stack.pop()!.cursor;
    pre.destroy();
    const {cursor, args} = stack[stack.length - 1]
    cursor.show(...args)
}

export const removeScene = (index: number) => {
    if (index === -1) {
        const current = stack.pop();
        if (current) current.cursor.destroy();
    }
    const current = stack[index];
    if (current) {
        current.cursor.destroy();
        stack.splice(index, 1)
    }
}
