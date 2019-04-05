/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Transaction } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { VehicleManufactureNetContext } from '../utils/context';

export class ParticipantsContract extends Contract {
    constructor() {
        super(NetworkName + '.participants');
    }

    public createContext() {
        return new VehicleManufactureNetContext();
    }

    @Transaction()
    public async registerManufacturer(
        ctx: VehicleManufactureNetContext,
        originCode: string, manufacturerCode: string,
    ) {
        const participant = ctx.getClientIdentity()
                                .newParticipantInstance(
                                    originCode, manufacturerCode,
                                );

        await ctx.getParticipantList().add(participant);
    }

    @Transaction()
    public async registerInsurer(ctx: VehicleManufactureNetContext) {
        await this.registerParticipant(ctx);
    }

    @Transaction()
    public async registerRegulator(ctx: VehicleManufactureNetContext) {
        await this.registerParticipant(ctx);
    }

    @Transaction()
    public async registerPerson(ctx: VehicleManufactureNetContext) {
        await this.registerParticipant(ctx);
    }

    private async registerParticipant(ctx: VehicleManufactureNetContext) {
        const participant = ctx.getClientIdentity().newParticipantInstance();

        await ctx.getParticipantList().add(participant);
}
}
