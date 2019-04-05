/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import 'reflect-metadata';
import { Manufacturer } from '../participants/manufacturer';
import { Participant } from '../participants/participant';
import { Person } from '../participants/person';
import { NotRequired } from '../utils/annotations';
import { Asset } from './asset';
import { IOptions } from './options';
import './vehicleDetails';
import { IVehicleDetails } from './vehicleDetails';

const logger = newLogger('ORDER');

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

    @Property('vehicleDetails', 'IVehicleDetails')
    private _vehicleDetails: IVehicleDetails;

    @Property('orderStatus', 'number')
    private _orderStatus: OrderStatus;

    @Property('vin', 'string')
    private _vin: string;

    @Property()
    private options: IOptions;

    @Property('ordererId', 'string')
    private _ordererId: string;

    constructor(
        id: string,
        vehicleDetails: IVehicleDetails, orderStatus: OrderStatus, options: IOptions, ordererId: string,
        @NotRequired vin?: string,
    ) {
        super(id, assetType);

        logger.info('ORDERER ID ' + ordererId);

        this._vehicleDetails = vehicleDetails;
        this._orderStatus = orderStatus;
        this.options = options;
        this._ordererId = ordererId;

        if (vin) {
            this._vin = vin;
        }
    }

    get orderStatus(): OrderStatus {
        return this._orderStatus;
    }

    set orderStatus(orderStatus: OrderStatus) {
        if (orderStatus < this._orderStatus) {
            throw new Error('Status of order cannot go backwards');
        }

        if (orderStatus - this._orderStatus !== 1) {
            throw new Error('Cannot skip order status step');
        }

        this._orderStatus = orderStatus;
    }

    get vehicleDetails(): IVehicleDetails {
        return this._vehicleDetails;
    }

    get vin(): string {
        return this._vin;
    }

    get ordererId(): string {
        return this._ordererId;
    }

    public isOrderer(orderer: Participant) {
        return orderer.getClass() === Person.getClass() &&
            orderer.id === this.ordererId;
    }

    public isManufacturer(manufacturer: Manufacturer) {
        return manufacturer.getClass() === Manufacturer.getClass() &&
            manufacturer.id === this.vehicleDetails.makeId;
    }
}
