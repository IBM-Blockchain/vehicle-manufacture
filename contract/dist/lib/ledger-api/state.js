/*
SPDX-License-Identifier: Apache-2.0
*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const getParams = require("get-params");
class State {
    static serialize(object) {
        return Buffer.from(JSON.stringify(object));
    }
    static deserialize(data, supportedClasses) {
        const json = JSON.parse(data.toString());
        const objClass = supportedClasses.get(json.class);
        if (!objClass) {
            throw new Error(`Unknown class of ${json.class}`);
        }
        return this.callConstructor(objClass, json);
    }
    static deserializeClass(data, objClass) {
        const json = JSON.parse(data);
        return this.callConstructor(objClass, json);
    }
    static makeKey(keyParts) {
        return keyParts.join(':');
    }
    static splitKey(key) {
        return key.split(':');
    }
    static callConstructor(objClass, json) {
        if (!(objClass.prototype instanceof State)) {
            throw new Error(`Cannot use ${objClass.prototype.name} as type State`);
        }
        const paramNames = getParams(objClass.prototype.constructor);
        const args = [];
        if (!paramNames.every((name) => {
            if (json.hasOwnProperty(name)) {
                let arg = json[name];
                try {
                    arg = JSON.parse(arg);
                }
                catch (err) {
                    // wasn't JSON oh well
                }
                args.push(arg);
                return true;
            }
            return false;
        })) {
            throw new Error('Could not deserialize JSON. Missing required fields.');
        }
        const object = new (objClass)(...args);
        return object;
    }
    constructor(stateClass, keyParts) {
        this.class = stateClass;
        this.key = State.makeKey(keyParts);
    }
    getClass() {
        return this.class;
    }
    getKey() {
        return this.key;
    }
    getSplitKey() {
        return State.splitKey(this.key);
    }
    serialize() {
        return State.serialize(this);
    }
}
exports.State = State;
//# sourceMappingURL=state.js.map