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

import { Object as ContractObject, Property } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

@ContractObject()
export class Asset extends State {
    public static generateClass(assetType: string): string {
        return NetworkName + '.assets.'  + assetType;
    }

    @Property('id', 'string')
    private _id: string;

    constructor(id: string, assetType: string) {
        super(Asset.generateClass(assetType), [id]);

        this._id = id;
    }

    get id(): string {
        return this._id;
    }

    public serialize(): Buffer {
        const toSerialize = JSON.parse(State.serialize(this).toString());

        Object.keys(toSerialize).forEach((key) => {
            if (key.startsWith('_')) {
                Object.defineProperty(toSerialize, key.slice(1), Object.getOwnPropertyDescriptor(toSerialize, key));
                delete toSerialize[key];
            }
        });

        return State.serialize(toSerialize);
    }
}
