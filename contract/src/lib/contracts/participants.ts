/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { Participant } from '../participants/participant';
import { NotRequired } from '../utils/annotations';
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
    public async getAll(ctx: VehicleManufactureNetContext) {
        const organization = await ctx.getClientIdentity().loadOrganization();
        const participants = await ctx.getParticipantList().getAll();
        return participants.filter((participant: Participant) => {
            return participant.orgName === organization.name;
        });
    }

    @Transaction()
    public async getOrganizations(ctx: VehicleManufactureNetContext) {
        return await ctx.getOrganizationList().getAll();
        // return ctx.getOrganizationList().get('arium')
    }

    @Transaction()
    public async registerParticipant(
        ctx: VehicleManufactureNetContext, originCode: string, manufacturerCode: string,
    ) {
        const orgName = ctx.getClientIdentity().getAttributeValue('vehicle_manufacture.company');

        await this.registerOrganization(ctx, orgName, originCode, manufacturerCode);
        const participant = await ctx.getClientIdentity().newParticipantInstance();

        await ctx.getParticipantList().add(participant);
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
