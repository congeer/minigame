import config from "./config";

const ShareManager: ShareManager = {
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

export default ShareManager
