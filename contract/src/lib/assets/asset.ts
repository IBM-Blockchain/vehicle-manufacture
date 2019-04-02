/*
SPDX-License-Identifier: Apache-2.0
*/

import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

export class Asset extends State {
    private id: string;

    constructor(id: string, assetType: string) {
        super(NetworkName + '.assets.'  + assetType, [assetType, id]);

        this.id = id;
    }

    public getId(): string {
        return this.id;
    }
}
