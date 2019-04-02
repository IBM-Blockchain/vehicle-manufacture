/*
SPDX-License-Identifier: Apache-2.0
*/

import { IOptions } from '../interfaces/options';
import { IVehicleDetails } from '../interfaces/vehicleDetails';
import { Person } from '../participants/person';
import { Asset } from './asset';

enum OrderStatus {
    PLACED = 0,
    SCHEDULED_FOR_MANUFACTURE,
    VIN_ASSIGNED,
    OWNER_ASSIGNED,
    DELIVERED,
}

export class Order extends Asset {

    private vehicleDetails: IVehicleDetails;
    private orderStatus: OrderStatus;
    private options: IOptions;
    private orderer: Person;

    constructor(
        id: string, vehicleDetails: IVehicleDetails, orderStatus: OrderStatus, options: IOptions, orderer: Person,
    ) {
        super(id, 'Order');

        this.vehicleDetails = vehicleDetails;
        this.orderStatus = orderStatus;
        this.options = options;
        this.orderer = orderer;
    }
}
