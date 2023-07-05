// @ts-ignore
import {FENGARI_COPYRIGHT, lauxlib, lua, lualib, to_luastring,} from 'fengari';
// @ts-ignore
import * as interop from 'fengari-interop';
import {ExtensionType, LoaderParser, settings, utils} from 'pixi.js'

export const luaParser: LoaderParser = {
    name: "lua-parser",
    extension: ExtensionType.LoadParser,
    test: (url) => utils.path.extname(url).toLowerCase() === ".lua",
    async load(url, args) {
        const response = await settings.ADAPTER.fetch(url);
        const lua = await response.text();
        const name = args?.alias?.[0];
        if (!name) {
            throw new Error("lua name is empty")
        }
        return loadLua(name, lua);
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

function loadLuaSource(source: any) {
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

export function loadLua(key: string, lua: string) {
    const invoke = loadLuaSource(lua).invoke(null, []);
    for (const after of afterLoad) {
        const {key: afterKey, fn} = after;
        if (afterKey === key) fn(invoke);
    }
    return invoke;
}

const afterLoad: LuaAfterLoad[] = []

export function afterLoadLua(key: string, fn: AfterLuaLoadFn) {
    afterLoad.push({key, fn});
}
