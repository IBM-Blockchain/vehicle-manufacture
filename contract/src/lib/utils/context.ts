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


import { Context } from 'fabric-contract-api';
import { Order, Policy, UsageEvent, Vehicle } from '../assets';
import { State } from '../ledger-api/state';
import { AssetList, OrganizationList, ParticipantList } from '../lists';
import { Insurer, Manufacturer, Organization, Regulator } from '../organizations';
import { Participant, Registrar, Task } from '../participants';
import { VehicleManufactureNetClientIdentity } from './client-identity';

export class VehicleManufactureNetContext extends Context {

    private ci: VehicleManufactureNetClientIdentity;
    private organizationList: OrganizationList;
    private participantList: ParticipantList;
    private vehicleList: AssetList<Vehicle>;
    private orderList: AssetList<Order>;
    private policyList: AssetList<Policy>;
    private usageList: AssetList<UsageEvent>;

    private caller: Participant;
    private callerOrg: Organization;

    constructor() {
        super();
        this.organizationList = new OrganizationList(this, 'organizations', [Manufacturer, Insurer, Regulator]);
        this.participantList = new ParticipantList(this, 'participant', [Registrar, Task]);
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
