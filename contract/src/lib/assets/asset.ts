/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

@Object()
export class Asset extends State {
    public static generateClass(assetType: string): string {
        return NetworkName + '.assets.'  + assetType;
    }

    @Property()
    private id: string;

    constructor(id: string, assetType: string) {
        super(Asset.generateClass(assetType), [id]);

        this.id = id;
    }

    public getId(): string {
        return this.id;
    }
}
