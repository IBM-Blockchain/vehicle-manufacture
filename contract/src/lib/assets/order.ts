/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Object, Property } from 'fabric-contract-api';
import 'reflect-metadata';
import { HistoricState } from '../ledger-api/state';
import { NotRequired } from '../utils/annotations';
import { Asset } from './asset';
import { IOptions } from './options';
import './vehicleDetails';
import { IVehicleDetails } from './vehicleDetails';

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

    public madeByOrg(orgId: string) {
        return this.vehicleDetails.makeId === orgId;
    }
}

// tslint:disable:max-classes-per-file
@Object()
export class HistoricOrder extends HistoricState<Order> {

    @Property()
    public value: Order;
}
