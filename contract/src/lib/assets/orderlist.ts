/*
SPDX-License-Identifier: Apache-2.0
*/

import { VehicleManufactureNetContext } from '../utils/context';
import { AssetList } from './assetlist';
import { Order } from './order';

export class OrderList extends AssetList<Order> {
    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx, 'orders', [Order]);
    }
}
