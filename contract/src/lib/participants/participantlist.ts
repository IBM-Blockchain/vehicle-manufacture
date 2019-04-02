/*
SPDX-License-Identifier: Apache-2.0
*/

import { Context } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { StateList } from '../ledger-api/statelist';
import { Participant } from './participant';

export class ParticipantList extends StateList {
    constructor(ctx: Context, listName: string, validTypes: any[]) {
        super(ctx, NetworkName + '.participantslist.' + listName);
        this.use(...validTypes);
    }

    public async add(participant: Participant) {
        return this.addState(participant);
    }

    public async get(participantId: string): Promise<Participant> {
        return this.getState(participantId);
    }

    public async update(participant: Participant) {
        return this.updateState(participant);
    }
}
