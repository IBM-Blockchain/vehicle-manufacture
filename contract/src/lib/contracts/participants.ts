/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Returns, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { Regulator } from '../organizations/regulator';
import { Person } from '../participants/person';
import { TelematicsDevice } from '../participants/telematics';
import { VehicleManufactureNetContext } from '../utils/context';

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
        return await ctx.getParticipantList().getAll();
    }

    @Transaction()
    @Returns('Person')
    public async registerSuper(
        ctx: VehicleManufactureNetContext, originCode?: string, manufacturerCode?: string,
    ): Promise<Person> {
        const orgName = ctx.getClientIdentity().getAttributeValue('vehicle_manufacture.company');
        const orgType = ctx.getClientIdentity().getAttributeValue('vehicle_manufacture.org_type');

        await this.registerOrganization(ctx, orgName, originCode, manufacturerCode);
        const participant = await ctx.getClientIdentity().newParticipantInstance();

        if (!(participant instanceof Person)) {
            throw new Error('Only callers of type Person may be registered as a super user');
        }

        switch (orgType) {
            case 'regulator':
            case 'insurer':
            case 'manufacturer':
                await ctx.getParticipantList().add(participant);
                break;
            default:
                throw new Error(`Participant type does not exist: ${orgType}`);
        }

        return participant;
    }

    @Transaction()
    @Returns('Person')
    public async registerPerson(ctx: VehicleManufactureNetContext, name: string, role: string): Promise<Person> {
        const {organization, participant} = await ctx.getClientIdentity().loadParticipant();
        if (!participant.canRegister) {
            throw new Error('This user cannot register new participants');
        }

        const customer = new Person(
            `${name}@${organization.name}`, role, organization.id, false,
        );
        await ctx.getParticipantList().add(customer);

        return customer;
    }

    @Transaction()
    @Returns('TelematicsDevice')
    public async registerTelematicsDevice(
        ctx: VehicleManufactureNetContext, name: string,
    ): Promise<TelematicsDevice> {
        const {organization, participant} = await ctx.getClientIdentity().loadParticipant();
        if (!participant.canRegister && organization instanceof Regulator) {
            throw new Error('This user cannot register new participants');
        }

        const device = new TelematicsDevice(
            `${name}@${organization.name}`, organization.id,
        );
        await ctx.getParticipantList().add(device);

        return device;
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
