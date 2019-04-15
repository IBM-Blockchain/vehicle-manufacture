/*
SPDX-License-Identifier: Apache-2.0
*/

import * as x509 from '@ampretia/x509';
import { Contract, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { VehicleManufactureNetContext } from '../utils/context';
import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';
import { Person } from '../participants/person';
const Certificate = pkijs.Certificate;


const logger = newLogger('PARTICIPANTS_CONTRACT');

export class ParticipantsContract extends Contract {
    constructor() {
        super(NetworkName + '.participants');
    }

    public createContext() {
        return new VehicleManufactureNetContext();
    }

    @Transaction()
    public async getOrganizations(ctx: VehicleManufactureNetContext) {
        return await ctx.getOrganizationList().getAll();
    }

    @Transaction()
    public async getCustomers(ctx: VehicleManufactureNetContext) {
        return await ctx.getPersonList().getAll();
    }

    @Transaction()
    public async registerSuper(
        ctx: VehicleManufactureNetContext, originCode: string, manufacturerCode: string,
    ) {
        const orgName = ctx.getClientIdentity().getAttributeValue('vehicle_manufacture.company');
        // const orgType = ctx.getClientIdentity().getAttributeValue('vehicle_manufacture.org_type');

        await this.registerOrganization(ctx, orgName, originCode, manufacturerCode);
        const participant = await ctx.getClientIdentity().newParticipantInstance();
        switch (participant.orgType) {
            case 'regulator':
            case 'insurer':
            case 'manufacturer':
                await ctx.getEmployeeList().add(participant);
                break;
            default:
                throw new Error(`Participant type does not exist: ${participant.orgType}`);
        }

    }

    @Transaction()
    public async registerPerson(ctx: VehicleManufactureNetContext, name: string, role: string) {
        const participant = await ctx.getClientIdentity().loadParticipant();
        const organization = await ctx.getClientIdentity().loadOrganization();
        if (!participant.canRegister) {
            throw new Error('This user cannot register new participants');
        }

        const customer = new Person(
            `${name}@${organization.name}`, role, organization.orgType, organization.name, false,
        );
        await ctx.getPersonList().add(customer);
    }

    private async registerOrganization(
        ctx: VehicleManufactureNetContext, orgName: string, ...additionalInfo: any
    ) {
        const organization = ctx.getClientIdentity().newOrganizationInstance(orgName, additionalInfo);
        if (!(await ctx.getOrganizationList().exists(orgName))) {
            await ctx.getOrganizationList().add(organization);
        }
    }
}
