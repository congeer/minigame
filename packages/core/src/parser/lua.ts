import {FENGARI_COPYRIGHT, lauxlib, lua, lualib, to_luastring,} from 'fengari';
import * as interop from 'fengari-interop';
import {ExtensionType, settings, utils} from 'pixi.js'

export const luaParser = {
    name: "lua-parser",
    extension: ExtensionType.LoadParser,
    test: (url) => utils.path.extname(url).toLowerCase() === ".lua",
    async load(url, args, loader) {
        const response = await settings.ADAPTER.fetch(url);
        const lua = await response.text();
        return loadLua(args.alias[0], lua);
    },
}

const {
    LUA_ERRSYNTAX,
    LUA_OK,
    lua_pop,
    lua_pushstring,
    lua_setglobal,
    lua_tojsstring
} = lua;
const {
    luaL_loadbuffer,
    luaL_newstate,
    luaL_requiref
} = lauxlib;
const {
    luaopen_js,
    tojs
} = interop;

const L = luaL_newstate();

lualib.luaL_openlibs(L);
luaL_requiref(L, to_luastring("js"), luaopen_js, 1);
lua_pop(L, 1);

lua_pushstring(L, to_luastring(FENGARI_COPYRIGHT));
lua_setglobal(L, to_luastring("_COPYRIGHT"));

function loadLuaSource(source) {
    if (typeof source == "string")
        source = to_luastring(source);
    else if (!(source instanceof Uint8Array))
        throw new TypeError("expects an array of bytes or javascript string");

    let ok = luaL_loadbuffer(L, source, null);
    let res;
    if (ok === LUA_ERRSYNTAX) {
        res = new SyntaxError(lua_tojsstring(L, -1));
    } else {
        res = tojs(L, -1);
    }
    lua_pop(L, 1);
    if (ok !== LUA_OK) {
        throw res;
    }
    return res;
}

export function loadLua(key, lua) {
    const invoke = loadLuaSource(lua).invoke(null, []);
    for (const after of afterLoad) {
        const {key: afterKey, fn} = after;
        if (afterKey === key) fn(invoke);
    }
    return invoke;
}

const afterLoad = []

export function afterLoadLua(key, fn) {
    afterLoad.push({key, fn});
}
