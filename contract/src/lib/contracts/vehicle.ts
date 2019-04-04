/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { IOptions } from '../assets/options';
import { Order, OrderStatus } from '../assets/order';
import { IVehicleDetails } from '../assets/vehicleDetails';
import { Person } from '../participants/person';
import { VehicleManufactureNetContext } from '../utils/context';
const logger = newLogger('VEHICLE');

export class VehicleContract extends Contract {
    constructor() {
        super(NetworkName + '.vehicles');
    }

    public createContext() {
        return new VehicleManufactureNetContext();
    }

    @Transaction()
    public async placeOrder(ctx: VehicleManufactureNetContext, vehicleDetails: IVehicleDetails, options: IOptions) {
        logger.error('HELLO WORLD', vehicleDetails, options);

        const person = await ctx.getClientIdentity().loadParticipant();

        if (!(person instanceof Person)) {
            throw new Error('Only callers of type Person can place orders');
        }

        const numOrders = await ctx.getOrderList().count();

        const order = new Order('ORDER_' + numOrders, vehicleDetails, OrderStatus.PLACED, options, person);

        await ctx.getOrderList().add(order);
    }
}
