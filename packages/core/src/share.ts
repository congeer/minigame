import {config} from "./config";

export interface ShareOptions {
    title?: string;
    imageUrl?: string;
    query?: string;
    success?: () => void;
    fail?: () => void;
    complete?: () => void;
}

interface IShareManager {
    titles: string[];

    getTitle(): string;

    addTitle(titles: string[]): void;

    clearTitle(): void;

    share(options: ShareOptions): void;
}

export const ShareManager: IShareManager = {
    titles: [],
    getTitle: () => {
        if (ShareManager.titles.length === 0) {
            return "";
        }
        return ShareManager.titles[Math.random() * ShareManager.titles.length | 0];
    },
    addTitle: (titles) => {
        ShareManager.titles.push(...titles);
    },
    clearTitle: () => {
        ShareManager.titles = [];
    },
    share: (options: ShareOptions) => {
        if (!options.title) {
            options.title = ShareManager.getTitle();
        }
        config.adapter.share(options)
    }
}
