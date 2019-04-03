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
    public async registerParticipant(ctx: VehicleManufactureNetContext) {
        const ci = ctx.getClientIdentity();

        const participant = ci.newParticipantInstance();

        await ctx.getParticipantList().add(participant);
    }
}
