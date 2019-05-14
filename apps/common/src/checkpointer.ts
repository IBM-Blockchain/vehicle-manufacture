import { BaseCheckpointer, Checkpoint } from 'fabric-network';

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
