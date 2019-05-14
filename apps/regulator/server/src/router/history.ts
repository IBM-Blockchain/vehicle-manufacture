import { ContractNames, ContractRouter, FabricProxy, IRequest } from 'common';
import { Response } from 'express';

export class HistoryRouter extends ContractRouter {
    public static basePath = 'histories';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = ContractNames.vehicle;
    }

    public async prepareRoutes() {
        this.router.get('/blocks', async (req: IRequest, res: Response) => {
            const history = (await this.fabricProxy.getHistory(req.user, {replay: true})).map(this.formatBlock);

            res.send(history);
        });

        this.router.get('/blocks/events/created', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, 'NEW_BLOCK');
        });

        this.fabricProxy.addBlockListener('admin', 'new-block-listener', (err, block) => {
            this.publishEvent({
                event_name: 'NEW_BLOCK',
                payload: Buffer.from(JSON.stringify(this.formatBlock(block))),
            })
        }, {filtered: false, replay: true});
    }

    private formatBlock(block) {
        block.transactions = block.transactions.map((transaction) => {
            transaction.caller.org = transaction.caller.msp.replace('MSP', '');
            delete transaction.caller.msp;
            return transaction;
        });
        
        return block;
    }
}