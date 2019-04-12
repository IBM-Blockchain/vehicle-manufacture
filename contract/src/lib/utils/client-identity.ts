/*
SPDX-License-Identifier: Apache-2.0
*/

import { ClientIdentity, newLogger } from 'fabric-shim';
import { Organization } from '../organizations/organization';
import { Participant } from '../participants/participant';
import { Person } from '../participants/person';
import { VehicleManufactureNetContext } from './context';
const logger = newLogger('CLIENTIDENTITY');

const ROLE_FIELD = 'vehicle_manufacture.role';
const ID_FIELD = 'vehicle_manufacture.username';
const COMPANY_FIELD = 'vehicle_manufacture.company';
const ORG_TYPE_FIELD = 'vehicle_manufacture.org_type';

export class VehicleManufactureNetClientIdentity extends ClientIdentity {
    private ctx: VehicleManufactureNetContext;

    constructor(ctx: VehicleManufactureNetContext) {
        super(ctx.stub);

        this.ctx = ctx;
    }

    public async loadParticipant(): Promise<Participant> {
        const id = this.getAttributeValue(ID_FIELD);
        try {
            switch (this.getAttributeValue(ROLE_FIELD)) {
                case 'person':
                    return await this.ctx.getParticipantList().get(id);
                default:
                    throw new Error('Unknown participant type ' + this.getAttributeValue(ROLE_FIELD));
            }
        } catch (err) {
            throw new Error(`Unable to load participant for client ${id} ERROR: ${err.message}`);
        }
    }

    public async loadOrganization() {
        const participant = await this.loadParticipant();
        const org = participant.orgName;
        return this.ctx.getOrganizationList().get(org);
    }

    public async newParticipantInstance(): Promise<Participant> {
        const id = this.getAttributeValue(ID_FIELD);
        const orgId = id.split('@')[1];
        const orgType = this.getAttributeValue(ORG_TYPE_FIELD);
        try {
            await this.ctx.getOrganizationList().get(orgId);
        } catch (err) {
            logger.error(`Organization ${orgId} does not exist`);
        }
        const role = this.getAttributeValue(ROLE_FIELD);

        switch (this.getAttributeValue(ROLE_FIELD)) {
            case 'person': return new Person(id, orgId, orgType, role);
            default:
                throw new Error('Unknown participant type ' + this.getAttributeValue(ROLE_FIELD));
        }
    }

    public newOrganizationInstance(orgName, additionalInfo: any): Organization {
        const orgType = this.getAttributeValue(ORG_TYPE_FIELD);
        switch (orgType) {
            case 'manufacturer':
                const organization = new Organization(orgName, orgName, orgType, ...additionalInfo);
                return organization;
        }
        return new Organization(orgName, orgName, orgType);
    }
}
