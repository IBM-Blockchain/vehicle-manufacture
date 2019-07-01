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
import { Insurer, Manufacturer, Regulator } from '../organizations';
import { Task } from '../participants';
import { VehicleManufactureNetClientIdentity } from './client-identity';

export class VehicleManufactureNetContext extends Context {

    public readonly organizationList: OrganizationList;
    public readonly participantList: ParticipantList;
    public readonly vehicleList: AssetList<Vehicle>;
    public readonly orderList: AssetList<Order>;
    public readonly policyList: AssetList<Policy>;
    public readonly usageList: AssetList<UsageEvent>;
    private _clientIdentity: VehicleManufactureNetClientIdentity;

    constructor() {
        super();
        this.organizationList = new OrganizationList(this, 'organizations', [Manufacturer, Insurer, Regulator]);
        this.participantList = new ParticipantList(this, 'participant', [Task]);
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

    public setClientIdentity() { // overwrites existing client identity function from super context
        this._clientIdentity = new VehicleManufactureNetClientIdentity(this);
    }

    public get clientIdentity() {
        return this._clientIdentity;
    }
}
