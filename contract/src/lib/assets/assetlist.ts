/*
SPDX-License-Identifier: Apache-2.0
*/

import { NetworkName } from '../../constants';
import { IState } from '../ledger-api/state';
import { StateList } from '../ledger-api/statelist';
import { VehicleManufactureNetContext } from '../utils/context';
import { Asset } from './asset';

export class AssetList<T extends Asset> extends StateList<T> {
    constructor(ctx: VehicleManufactureNetContext, listName: string, validTypes: Array<IState<T>>) {
        super(ctx, NetworkName + '.lists.assets.' + listName);
        this.use(...validTypes);
    }
}
