/*
SPDX-License-Identifier: Apache-2.0
*/

import { Order } from '../assets/order';
import { VehicleManufactureNetContext } from '../utils/context';
import { AssetList } from './assetlist';

export class OrderList extends AssetList<Order> {
    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx, 'orders', [Order]);
    }
}
