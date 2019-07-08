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

import { ClientIdentity } from 'fabric-shim';
import { RolesPrefix } from '../../constants';
import { Insurer } from '../organizations/insurer';
import { Manufacturer } from '../organizations/manufacturer';
import { Organization } from '../organizations/organization';
import { Regulator } from '../organizations/regulator';
import { Participant } from '../participants/participant';
import { Task } from '../participants/task';
import { VehicleManufactureNetContext } from './context';

const ID_FIELD = 'vehicle_manufacture.username';
const ORG_NAME_FIELD = 'vehicle_manufacture.company';
const ORG_TYPE_FIELD = 'vehicle_manufacture.org_type';

export class VehicleManufactureNetClientIdentity extends ClientIdentity {
    private ctx: VehicleManufactureNetContext;
    private attrs: object;
    private _participant: Participant;
    private _organization: Organization;

    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx.stub);

        this.ctx = ctx;
    }

    public async init(): Promise<void> {
        const participantId = this.getAttributeValue(ID_FIELD);

        if (await this.ctx.participantList.exists(participantId)) {
            this._participant = await this.ctx.participantList.get(participantId);
            this._organization = await this.ctx.organizationList.get(this._participant.orgId);
        } else {
            const orgId = participantId.split('@')[1];
            const roles = [];

            // tslint:disable-next-line: forin
            for (const attr in this.attrs) {
                console.log(attr.startsWith(RolesPrefix), attr, this.attrs[attr]);
                if (attr.startsWith(RolesPrefix) && this.attrs[attr] === 'y') {
                    roles.push(attr.split(RolesPrefix)[1]);
                }
            }

            this._participant = new Task(participantId, roles, orgId);
            this.ctx.participantList.add(this._participant);

            if (await this.ctx.organizationList.exists(this._participant.orgId)) {
                this._organization = await this.ctx.organizationList.get(this._participant.orgId);
            } else {
                this._organization = this.newOrganizationInstance(this.getAttributeValue(ORG_NAME_FIELD));
                this.ctx.organizationList.add(this._organization);
            }
        }
    }

    public newOrganizationInstance(orgName: string): Organization {
        const orgType = this.getAttributeValue(ORG_TYPE_FIELD);
        switch (orgType) {
            case 'manufacturer':
                return new Manufacturer(orgName, orgName, null, null);
            case 'insurer':
                return new Insurer(orgName, orgName);
            case 'regulator':
                return new Regulator(orgName, orgName);
            default:
                throw new Error('Invalid organization type: ' + orgType);
        }
    }

    public get participant() {
        return this._participant;
    }

    public get organization() {
        return this._organization;
    }
}
