import { Checkpoint } from 'fabric-network';
import * as BaseCheckpointer from 'fabric-network/lib/impl/event/basecheckpointer';

export class GenesisCheckpointer extends BaseCheckpointer {
    constructor() {
        super();
    }

    public async initialize(): Promise<void> {} // tslint:disable-line:no-empty

    public async save(): Promise<void> {} // tslint:disable-line:no-empty

    public async load(): Promise<Checkpoint> {
        return {
            blockNumber: 1,
            transactionIds: [],
        };
    }
}
