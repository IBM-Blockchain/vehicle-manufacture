/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import 'reflect-metadata';
import { Organization } from '../organizations/organization';
import { Participant } from '../participants/participant';
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

    public static getSubClasses() {
        return [];
    }

    private _vehicleDetails: IVehicleDetails;

    private _orderStatus: OrderStatus;

    private _vin: string;

    @Property()
    private options: IOptions;

    private _ordererId: string;

    constructor(
        id: string,
        vehicleDetails: IVehicleDetails, orderStatus: OrderStatus, options: IOptions, ordererId: string,
        @NotRequired vin?: string,
    ) {
        super(id, assetType);

        this._vehicleDetails = vehicleDetails;
        this._orderStatus = orderStatus;
        this.options = options;
        this._ordererId = ordererId;

        if (vin) {
            this._vin = vin;
        }
    }

    @Property('orderStatus', 'number')
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

    @Property('vehicleDetails', 'IVehicleDetails')
    get vehicleDetails(): IVehicleDetails {
        return this._vehicleDetails;
    }

    @Property('vin', 'string')
    get vin(): string {
        return this._vin;
    }

    @Property('ordererId', 'string')
    get ordererId(): string {
        return this._ordererId;
    }

    public canBeChangedBy(entity: Organization|Participant) {
        if (entity instanceof Organization) {
            const org = entity.getName();
            return org === this.vehicleDetails.makeId;
        } else if (entity instanceof Participant) {
            return entity.id === this.ordererId;
        }
    }
}
