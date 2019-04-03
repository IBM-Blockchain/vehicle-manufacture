/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

import * as getParams from 'get-params';

export interface IState<T> {
    new (...args: any[]): T;
    getClass(): string;
}

export class State {

    public static serialize(object: object): Buffer {
        return Buffer.from(JSON.stringify(object));
    }

    public static deserialize(data: Buffer, supportedClasses: Map<string, IState<State>>): State {
        const json = JSON.parse(data.toString());
        const objClass = supportedClasses.get(json.class);
        if (!objClass) {
            throw new Error(`Unknown class of ${json.class}`);
        }

        return this.callConstructor(objClass, json);
    }

    public static deserializeClass<T extends State>(data: string, objClass: IState<T>): T {
        const json = JSON.parse(data);
        return this.callConstructor<T>(objClass, json);
    }

    public static makeKey(keyParts: string[]): string {
        return keyParts.join(':');
    }

    public static splitKey(key: string): string[] {
        return key.split(':');
    }

    private static callConstructor<T extends State>(objClass: IState<T>, json: object): T {
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
                } catch (err) {
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

    private class: string;
    private key: string;

    constructor(stateClass: string, keyParts: string[]) {
        this.class = stateClass;
        this.key = State.makeKey(keyParts);
    }

    public getClass(): string {
        return this.class;
    }

    public getKey(): string {
        return this.key;
    }

    public getSplitKey(): string[] {
        return State.splitKey(this.key);
    }

    public serialize(): Buffer {
        return State.serialize(this);
    }
}
