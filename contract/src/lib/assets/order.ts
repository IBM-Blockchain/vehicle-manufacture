/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { Person } from '../participants/person';
import { Asset } from './asset';
import { IOptions } from './options';
import { IVehicleDetails } from './vehicleDetails';

export enum OrderStatus {
    PLACED = 0,
    SCHEDULED_FOR_MANUFACTURE,
    VIN_ASSIGNED,
    OWNER_ASSIGNED,
    DELIVERED,
}

const assetType = 'Order';

@Object()
export class Order extends Asset {
    public static getClass() {
        return Asset.generateClass(assetType);
    }

    @Property()
    private vehicleDetails: IVehicleDetails;

    @Property()
    private orderStatus: OrderStatus;

    @Property()
    private options: IOptions;

    @Property()
    private orderer: Person;

    constructor(
        id: string, vehicleDetails: IVehicleDetails, orderStatus: OrderStatus, options: IOptions, orderer: Person,
    ) {
        super(id, assetType);

        this.vehicleDetails = vehicleDetails;
        this.orderStatus = orderStatus;
        this.options = options;
        this.orderer = orderer;
    }
}
