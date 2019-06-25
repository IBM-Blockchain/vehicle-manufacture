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

import { ClientIdentity, newLogger } from 'fabric-shim';
import { RolesPrefix } from '../../constants';
import { Insurer } from '../organizations/insurer';
import { Manufacturer } from '../organizations/manufacturer';
import { Organization } from '../organizations/organization';
import { Regulator } from '../organizations/regulator';
import { Participant } from '../participants/participant';
import { Registrar } from '../participants/registrar';
import { Task } from '../participants/task';
import { VehicleManufactureNetContext } from './context';
const logger = newLogger('CLIENTIDENTITY');

const REGISTRAR_ROLE_FIELD = 'vehicle_manufacture.role.participant.create';
const ID_FIELD = 'vehicle_manufacture.username';
const ORG_TYPE_FIELD = 'vehicle_manufacture.org_type';

export class VehicleManufactureNetClientIdentity extends ClientIdentity {
    private ctx: VehicleManufactureNetContext;
    private attrs: object;

    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx.stub);

        this.ctx = ctx;
    }

    public async loadParticipant(): Promise<{participant: Participant, organization: Organization}> {
        const id = this.getAttributeValue(ID_FIELD);

        try {
            const participant = await this.ctx.participantList.get(id);

            return {
                organization: await this.ctx.organizationList.get(participant.orgId),
                participant,
            };
        } catch (err) {
            throw new Error(`Unable to load participant for client ${id} ERROR: ${err.message}`);
        }
    }

    public newParticipantInstance(): Participant {
        const id = this.getAttributeValue(ID_FIELD);
        const orgId = id.split('@')[1];

        if (this.assertAttributeValue(REGISTRAR_ROLE_FIELD, 'y')) {
            return new Registrar(id, orgId);
        } else {
            const roles = [];

            for (const attr in this.attrs) {
                if (attr.startsWith(RolesPrefix) && this.attrs[attr].value === 'y') {
                    roles.push(attr.split(RolesPrefix)[1]);
                }
            }

            return new Task(id, roles, orgId);
        }
    }

    public newOrganizationInstance(orgName: string, additionalInfo: any): Organization {
        const orgType = this.getAttributeValue(ORG_TYPE_FIELD);
        switch (orgType) {
            case 'manufacturer':
                return new Manufacturer(orgName, orgName, additionalInfo[0], additionalInfo[1]);
            case 'insurer':
                return new Insurer(orgName, orgName);
            case 'regulator':
                return new Regulator(orgName, orgName);
            default:
                throw new Error('Invalid organization type: ' + orgType);
        }
    }
}
