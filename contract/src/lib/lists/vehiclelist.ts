/*
SPDX-License-Identifier: Apache-2.0
*/

import { Vehicle } from '../assets/vehicle';
import { VehicleManufactureNetContext } from '../utils/context';
import { AssetList } from './assetlist';

export class VehicleList extends AssetList<Vehicle> {
    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx, 'vehicles', [Vehicle]);
    }
}
