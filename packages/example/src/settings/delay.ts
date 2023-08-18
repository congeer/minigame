import {setting} from "@/store";

export const delays = (key: string) => {
    const multiplier = setting('multiplier') ?? 0;
    if (multiplier === 0) {
        return 0;
    }
    const ret: { [key: string]: number } = {
    };
    return ret[key] / multiplier;
}
