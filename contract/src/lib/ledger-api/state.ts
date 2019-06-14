/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

import { Object as ContractObject, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import * as getParams from 'get-params';

const logger = newLogger('STATE');

export interface IState<T> {
    new (...args: any[]): T;
    getClass(): string;
}

@ContractObject()
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

        const paramNames = Reflect.getMetadata('contract:function', objClass.prototype, 'constructor') ||
            getParams(objClass.prototype.constructor);

        const args = [];
        const missingFields = [];

        if (!paramNames.every((name) => {
            let ignoreMissing = false;

            if (name.endsWith('?')) {
                name = name.slice(0, -1);
                ignoreMissing = true;
            }
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

            if (!ignoreMissing) {
                missingFields.push(name);
            }

            return ignoreMissing;
        })) {
            throw new Error('Could not deserialize JSON. Missing required fields.' + JSON.stringify(missingFields));
        }
        const object = new (objClass)(...args);

        return object;
    }

    private class: string;
    private subClass?: string;
    private key: string;

    constructor(stateClass: string, keyParts: string[]) {
        this.class = stateClass;
        this.key = State.makeKey(keyParts);
    }

    public getClass(): string {
        return this.class;
    }

    public getSubClass(): string {
        return this.subClass;
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

// tslint:disable:max-classes-per-file
@ContractObject()
export class IHistoricState<T extends State> {
    public value: T;

    @Property()
    public timestamp: number;

    @Property()
    public txId: string;

    constructor(timestamp: number, txId: string, value: T) {
        this.timestamp = timestamp;
        this.txId = txId;
        this.value = value;
    }

    public serialize(): Buffer {
        const obj = Object.assign(this, {value: JSON.parse(this.value.serialize().toString())});

        return Buffer.from(JSON.stringify(obj));
    }
}
