/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { CONTRACT_NAMES, ContractRouter, FabricProxy, IRequest } from 'common';
import { Response } from 'express';

export class HistoryRouter extends ContractRouter {
    public static basePath = 'histories';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = CONTRACT_NAMES.vehicle;
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
