/*
SPDX-License-Identifier: Apache-2.0
*/

import { Context } from 'fabric-contract-api';
import { Order } from '../assets/order';
import { Policy } from '../assets/policy';
import { UsageEvent } from '../assets/usageEvents';
import { Vehicle } from '../assets/vehicle';
import { State } from '../ledger-api/state';
import { AssetList } from '../lists/assetlist';
import { OrganizationList } from '../lists/organizationlist';
import { ParticipantList } from '../lists/participantlist';
import { Insurer } from '../organizations/insurer';
import { Manufacturer } from '../organizations/manufacturer';
import { Regulator } from '../organizations/regulator';
import { Person } from '../participants/person';
import { TelematicsDevice } from '../participants/telematics';
import { VehicleManufactureNetClientIdentity } from './client-identity';

export class VehicleManufactureNetContext extends Context {

    private ci: VehicleManufactureNetClientIdentity;
    private organizationList: OrganizationList;
    private participantList: ParticipantList;
    private vehicleList: AssetList<Vehicle>;
    private orderList: AssetList<Order>;
    private policyList: AssetList<Policy>;
    private usageList: AssetList<UsageEvent>;

    constructor() {
        super();
        this.organizationList = new OrganizationList(this, 'organizations', [Manufacturer, Insurer, Regulator]);
        this.participantList = new ParticipantList(this, 'participant', [Person, TelematicsDevice]);
        this.vehicleList = new AssetList(this, 'vehicles', [Vehicle]);
        this.orderList = new AssetList(this, 'orders', [Order]);
        this.policyList = new AssetList(this, 'policies', [Policy]);
        this.usageList = new AssetList(this, 'usageEvents', [UsageEvent]);
    }

    public setEvent(eventName: string, payload: State) {
        const buffer = payload.serialize();
        const json = JSON.parse(buffer.toString('utf8'));
        json.timestamp = (this.stub.getTxTimestamp().getSeconds() as any).toInt() * 1000;
        this.stub.setEvent(eventName, Buffer.from(JSON.stringify(json)));
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

    public getVehicleList(): AssetList<Vehicle> {
        return this.vehicleList;
    }

    public getOrderList(): AssetList<Order> {
        return this.orderList;
    }

    public getPolicyList(): AssetList<Policy> {
        return this.policyList;
    }

    public getUsageList(): AssetList<UsageEvent> {
        return this.usageList;
    }
}
