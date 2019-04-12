/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object as ContractObject, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

const logger = newLogger('ASSET');

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

        return Buffer.from(State.serialize(toSerialize));
    }
}
