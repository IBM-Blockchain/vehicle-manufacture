/*
SPDX-License-Identifier: Apache-2.0
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
            const participant = await this.ctx.getParticipantList().get(id);

            return {
                organization: await this.ctx.getOrganizationList().get(participant.orgId),
                participant,
            };
        } catch (err) {
            throw new Error(`Unable to load participant for client ${id} ERROR: ${err.message}`);
        }
    }

    public async updateParticipant(): Promise<Participant> {
        const newParticipant = await this.newParticipantInstance();
        await this.ctx.getParticipantList().update(newParticipant);
        const participant = await this.ctx.getParticipantList().get(newParticipant.id);

        return participant;
    }

    public async newParticipantInstance(): Promise<Participant> {
        const id = this.getAttributeValue(ID_FIELD);
        const orgId = id.split('@')[1];

        try {
            await this.ctx.getOrganizationList().get(orgId);
        } catch (err) {
            logger.warn(`Organization ${orgId} does not exist`);
        }

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
