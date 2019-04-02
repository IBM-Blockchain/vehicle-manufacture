import { State } from '../ledger-api/state';
export declare class Participant extends State {
    private id;
    constructor(id: string, participantType: string);
    getId(): string;
}
