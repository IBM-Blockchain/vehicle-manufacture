/*
SPDX-License-Identifier: Apache-2.0
*/

import { VehicleManufactureNetContext } from '../utils/context';
import { AssetList } from './assetlist';
import { Vehicle } from './vehicle';

export class VehicleList extends AssetList<Vehicle> {
    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx, 'vehicles', [Vehicle]);
    }
}
