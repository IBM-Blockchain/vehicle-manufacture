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
import 'reflect-metadata';
import { ReflectParams } from 'reflect-params';

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

    public static makeKey(keyParts: string[]): string {
        return keyParts.join(':');
    }

    public static splitKey(key: string): string[] {
        return key.split(':');
    }

    private static callConstructor<T extends State>(objClass: IState<T>, json: object): T {
        if (!(objClass.prototype instanceof State)) {
            throw new Error(`Cannot use ${objClass.name} as type State`);
        }

        const paramNames: string[] = Reflect.getMetadata('contract:function', objClass.prototype, 'constructor') ||
            ReflectParams(objClass.prototype.constructor);

        const args = [];
        const missingFields = [];

        paramNames.forEach((name) => {
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
            } else if (!ignoreMissing) {
                missingFields.push(name);
            }
        });

        if (missingFields.length !== 0) {
            throw new Error('Could not deserialize JSON. Missing required fields. ' + JSON.stringify(missingFields));
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
export class HistoricState<T extends State> {
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
