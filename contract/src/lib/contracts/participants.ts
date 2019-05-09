/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Param, Returns, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName, Roles, RolesPrefix } from '../../constants';
import { Registrar } from '../participants/registrar';
import { Task } from '../participants/task';
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
    @Returns('Registrar')
    public async registerRegistrar(
        ctx: VehicleManufactureNetContext, originCode?: string, manufacturerCode?: string,
    ): Promise<Registrar> {
        if (ctx.getClientIdentity().getAttributeValue(RolesPrefix + Roles.PARTICIPANT_CREATE) !== 'y') {
            throw new Error(
                `Only callers with role ${RolesPrefix + Roles.PARTICIPANT_CREATE} can register as registrar`,
            );
        }

        const orgName = ctx.getClientIdentity().getAttributeValue('vehicle_manufacture.company');
        const orgType = ctx.getClientIdentity().getAttributeValue('vehicle_manufacture.org_type');

        await this.registerOrganization(ctx, orgName, originCode, manufacturerCode);
        const participant = await ctx.getClientIdentity().newParticipantInstance();

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
    @Param('roles', 'string[]')
    @Returns('Task')
    public async registerTask(ctx: VehicleManufactureNetContext, name: string, roles: string[]): Promise<Task> {
        const {organization, participant} = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.PARTICIPANT_CREATE)) {
            throw new Error(`Only callers with role ${Roles.PARTICIPANT_CREATE} can register a task user`);
        }

        roles = roles.filter((role) => {
            return role.startsWith(RolesPrefix);
        }).map((role) => {
            return role.split(RolesPrefix)[1];
        });

        const person = new Task(
            `${name}@${organization.name}`, roles, organization.id,
        );

        await ctx.getParticipantList().add(person);

        return person;
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
