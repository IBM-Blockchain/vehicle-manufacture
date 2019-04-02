/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { Order } from '../assets/order';
import { IOptions } from '../interfaces/options';
import { IVehicleDetails } from '../interfaces/vehicleDetails';
import { Person } from '../participants/person';
import { VehicleManufactureNetContext } from '../utils/context';

export class VehicleContract extends Contract {
    constructor() {
        super(NetworkName + '.vehicles');
    }

    public async PlaceOrder(ctx: VehicleManufactureNetContext, vehicleDetails: IVehicleDetails, options: IOptions) {
        const person = await ctx.getClientIdentity().loadParticipant();

        if (!(person instanceof Person)) {
            throw new Error('Only callers of type Person can place orders');
        }

        const order = new Order();
    }
}
