/*
SPDX-License-Identifier: Apache-2.0
*/

import { Context } from 'fabric-contract-api';
import { OrderList } from '../lists/orderlist';
import { ParticipantList } from '../lists/participantlist';
import { VehicleList } from '../lists/vehiclelist';
import { Insurer } from '../participants/insurer';
import { Manufacturer } from '../participants/manufacturer';
import { Person } from '../participants/person';
import { Regulator } from '../participants/regulator';
import { VehicleManufactureNetClientIdentity } from './client-identity';

export class VehicleManufactureNetContext extends Context {

    private ci: VehicleManufactureNetClientIdentity;
    private participantList: ParticipantList;
    private vehicleList: VehicleList;
    private orderList: OrderList;

    constructor() {
        super();

        this.participantList = new ParticipantList(this, 'main', [Manufacturer, Regulator, Insurer, Person]);
        this.vehicleList = new VehicleList(this);
        this.orderList = new OrderList(this);
    }

    public setClientIdentity() { // horrible hack breaks default clientIdentity as overwrites the function
        this.ci = new VehicleManufactureNetClientIdentity(this);
    }

    public getClientIdentity(): VehicleManufactureNetClientIdentity {
        return this.ci;
    }

    public getParticipantList(): ParticipantList {
        return this.participantList;
    }

    public getVehicleList(): VehicleList {
        return this.vehicleList;
    }

    public getOrderList(): OrderList {
        return this.orderList;
    }
}
