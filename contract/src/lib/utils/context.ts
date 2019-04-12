/*
SPDX-License-Identifier: Apache-2.0
*/

import { Context } from 'fabric-contract-api';
import { OrderList } from '../lists/orderlist';
import { OrganizationList } from '../lists/organizationlist';
import { ParticipantList } from '../lists/participantlist';
import { VehicleList } from '../lists/vehiclelist';
import { Organization } from '../organizations/organization';
import { Person } from '../participants/person';
import { VehicleManufactureNetClientIdentity } from './client-identity';

export class VehicleManufactureNetContext extends Context {

    private ci: VehicleManufactureNetClientIdentity;
    private organizationList: OrganizationList;
    private participantList: ParticipantList;
    private vehicleList: VehicleList;
    private orderList: OrderList;

    constructor() {
        super();
        this.organizationList = new OrganizationList(this, 'organizations', [Organization]);
        this.participantList = new ParticipantList(this, 'main', [Person]);
        this.vehicleList = new VehicleList(this);
        this.orderList = new OrderList(this);
    }

    public setClientIdentity() { // horrible hack breaks default clientIdentity as overwrites the function
        this.ci = new VehicleManufactureNetClientIdentity(this);
    }

    public getClientIdentity(): VehicleManufactureNetClientIdentity {
        return this.ci;
    }

    public getOrganizationList(): OrganizationList {
        return this.organizationList;
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
