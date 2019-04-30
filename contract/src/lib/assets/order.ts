/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import 'reflect-metadata';
import { IHistoricState } from '../ledger-api/state';
import { Participant } from '../participants/participant';
import { NotRequired } from '../utils/annotations';
import { Organization } from './../organizations/organization';
import { Regulator } from './../organizations/regulator';
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

@Object()
export class Order extends Asset {
    public static getClass() {
        return Asset.generateClass(Order.name);
    }

    private _vehicleDetails: IVehicleDetails;

    private _orderStatus: OrderStatus;

    private placed;

    @Property()
    private options: IOptions;

    private _ordererId: string;

    private _vin: string;

    constructor(
        id: string,
        vehicleDetails: IVehicleDetails,
        orderStatus: OrderStatus,
        options: IOptions,
        ordererId: string,
        placed: number,
        @NotRequired vin?: string,
    ) {
        super(id, Order.name);

        this._vehicleDetails = vehicleDetails;
        this._orderStatus = orderStatus;
        this.options = options;
        this._ordererId = ordererId;
        this.placed = placed;

        if (vin) {
            this._vin = vin;
        }
    }

    @Property()
    get orderStatus(): OrderStatus {
        return this._orderStatus;
    }

    set orderStatus(orderStatus: OrderStatus) {
        if (orderStatus <= this._orderStatus) {
            throw new Error('Status of order cannot go backwards or remain the same');
        }

        if (orderStatus - this._orderStatus !== 1) {
            throw new Error('Cannot skip order status step');
        }

        this._orderStatus = orderStatus;
    }

    @Property()
    get vehicleDetails(): IVehicleDetails {
        return this._vehicleDetails;
    }

    @Property()
    get ordererId(): string {
        return this._ordererId;
    }

    @Property()
    get vin(): string {
        return this._vin;
    }

    set vin(vin: string) {
        this._vin = vin;
    }

    public canBeChangedBy(participant: Participant, organization: Organization) {
        if (participant.orgId !== organization.id) {
            throw new Error('Participant is not in organization');
        }
        return participant.id === this.ordererId ||
               (participant.isEmployee() && this.vehicleDetails.makeId === organization.id)
               || participant.isEmployee() && organization instanceof Regulator;
    }
}

// tslint:disable:max-classes-per-file
@Object()
export class HistoricOrder extends IHistoricState<Order> {

    @Property()
    public value: Order;
}
