import { Context } from 'fabric-contract-api';
import { StateList } from '../ledger-api/statelist';
import { Participant } from './participant';
export declare class ParticipantList extends StateList {
    constructor(ctx: Context, listName: string, validTypes: any[]);
    add(participant: Participant): Promise<void>;
    get(participantId: string): Promise<Participant>;
    update(participant: Participant): Promise<void>;
}
