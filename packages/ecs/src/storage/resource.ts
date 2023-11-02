import {inherit, isType} from "../inherit";
import {MetaInfo} from "../meta";

export class Resource extends MetaInfo {
    _lastTick_ = 0;
    _changeTick_ = 0;
    _currentTick_ = 0;

    constructor() {
        super(Resource);
        Object.defineProperties(this, {
            _lastTick_: {
                value: 0,
                enumerable: false,
                writable: true
            },
            _changeTick_: {
                value: 0,
                enumerable: false,
                writable: true
            },
            _currentTick_: {
                value: 0,
                enumerable: false,
                writable: true
            }
        })
    }

    isChanged() {
        if (this._lastTick_ !== undefined) {
            return this._changeTick_ >= this._lastTick_;
        } else {
            return false;
        }
    }

}

export const resource = function (target: any): typeof target {
    return inherit(target, Resource)
}

export const isResource = (target: any) => {
    return isType(target, Resource)
}
