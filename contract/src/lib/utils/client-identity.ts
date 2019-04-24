/*
SPDX-License-Identifier: Apache-2.0
*/

import { ClientIdentity, newLogger } from 'fabric-shim';
import { Insurer } from '../organizations/insurer';
import { Manufacturer } from '../organizations/manufacturer';
import { Organization } from '../organizations/organization';
import { Regulator } from '../organizations/regulator';
import { Participant } from '../participants/participant';
import { Person } from '../participants/person';
import { TelematicsDevice } from '../participants/telematics';
import { VehicleManufactureNetContext } from './context';
const logger = newLogger('CLIENTIDENTITY');

const ROLE_FIELD = 'vehicle_manufacture.role';
const ID_FIELD = 'vehicle_manufacture.username';
const ORG_TYPE_FIELD = 'vehicle_manufacture.org_type';
const CAN_REGISTER_FIELD = 'vehicle_manufacture.can_register';

export class VehicleManufactureNetClientIdentity extends ClientIdentity {
    private ctx: VehicleManufactureNetContext;

    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx.stub);

        this.ctx = ctx;
    }

    public async loadParticipant(): Promise<{participant: Participant, organization: Organization}> {
        const id = this.getAttributeValue(ID_FIELD);
        const role = this.getAttributeValue(ROLE_FIELD);
        try {
            switch (role) {
                case 'private_entity':
                case 'employee':
                case 'telematic':
                    const participant = await this.ctx.getParticipantList().get(id);
                    return {
                        organization: await this.ctx.getOrganizationList().get(participant.orgId),
                        participant,
                    };
                default:
                    throw new Error(`Unknown participant type ${role}`);
            }
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
        const orgType = this.getAttributeValue(ORG_TYPE_FIELD);
        try {
            await this.ctx.getOrganizationList().get(orgId);
        } catch (err) {
            logger.warn(`Organization ${orgId} does not exist`);
        }
        const role = this.getAttributeValue(ROLE_FIELD);
        const canRegister = this.getAttributeValue(CAN_REGISTER_FIELD) === 'y';

        switch (role) {
            case 'employee':
                const employee = new Person(id, role, orgId, canRegister);
                return employee;
            case 'private_entity':
                const private_entity = new Person(id, role, orgId, false);
                return private_entity;
            case 'telematic':
                const telematic = new TelematicsDevice(id, orgId);
                return telematic;
            default:
                throw new Error('Unknown participant type ' + this.getAttributeValue(ROLE_FIELD));
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
