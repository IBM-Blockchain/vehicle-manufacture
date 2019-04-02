/*
SPDX-License-Identifier: Apache-2.0
*/

import { Context } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { StateList } from '../ledger-api/statelist';
import { Asset } from './asset';

export class AssetList extends StateList {
    constructor(ctx: Context, listName: string, validTypes: any[]) {
        super(ctx, NetworkName + '.assetslist.' + listName);
        this.use(...validTypes);
    }

    public async add(asset: Asset) {
        return this.addState(asset);
    }

    public async get(assetId: string): Promise<Asset> {
        return this.getState(assetId);
    }

    public async getAllOfType(type: string) {
        return this.getAllStates(type);
    }

    public async update(asset: Asset) {
        return this.updateState(asset);
    }
}
