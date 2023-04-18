import {I18n} from "i18n-js";

import {ExtensionType, settings, utils} from "pixi.js";

const i18n = new I18n();
i18n.defaultLocale = navigator.language
i18n.locale = navigator.language
i18n.missingBehavior = 'guess';
export const i18nParser = {
    name: "i18n-parser",
    extension: ExtensionType.LoadParser,
    test: (url) => utils.path.extname(url).toLowerCase() === ".i18n",
    async load(url, args, loader) {
        const location = args.alias[0].substring(5, args.alias[0].length - 5);
        const response = await settings.ADAPTER.fetch(url);
        const json = await response.json();
        const trans = {}
        trans[location] = json
        i18n.store(trans)
        return json;
    },
}

export {i18n}
