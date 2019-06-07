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
import { Response } from 'express';
import FabricProxy from '../../fabricproxy';
import { IRequest } from '../../interfaces';
import { BaseRouter } from './router';

export abstract class ContractRouter extends BaseRouter {

    protected readonly fabricProxy: FabricProxy;

    private _contractName: string;

    constructor(fabricProxy: FabricProxy) {
        super();

        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        for (const subRouterClass of this.subRouters) {
            const subRouter = new subRouterClass(this.fabricProxy);

            if (subRouter instanceof ContractRouter) {
                subRouter.contractName = this.contractName;
            }

            await subRouter.prepareRoutes();

            this.router.use('/' + subRouterClass.basePath, subRouter.getRouter());
        }
    }

    protected get contractName(): string {
        if (!this._contractName) {
            throw new Error('Tried to get contract name before it was set');
        }

        return this._contractName;
    }

    protected set contractName(contractName: string) {
        this._contractName = contractName;
    }

    protected async transactionToCall(
        transactionName: string, forceJSON: boolean = false,
    ): Promise<(req: IRequest, res: Response) => void> {
        const metadata = await this.fabricProxy.getMetadata();

        if (!metadata.contracts.hasOwnProperty(this.contractName)) {
            throw new Error(`Failed to find contract with name ${this.contractName} in metadata`);
        }

        const contractMetadata = metadata.contracts[this.contractName];
        const txn = contractMetadata.transactions.find((transaction) => transaction.name === transactionName);

        if (!txn) {
            throw new Error(`Transaction ${transactionName} not found in metadata for contract ${this.contractName}`);
        }

        return async (req, res) => {
            const args = [];

            if (txn.parameters) {
                const missingParams = [];

                txn.parameters.forEach((param) => {
                    let rawData;
                    if (req.params.hasOwnProperty(param.name)) {
                        rawData = req.params[param.name];
                    } else if (req.body.hasOwnProperty(param.name)) {
                        rawData = req.body[param.name];
                    } else {
                        missingParams.push(param.name);
                        return;
                    }

                    if (param.schema.type && param.schema.type === 'string') {
                        args.push(rawData);
                    } else {
                        args.push(JSON.stringify(rawData));
                    }
                });

                if (missingParams.length > 0) {
                    res.status(400);
                    res.json({
                        msg: ['Bad request. Missing parameters: ' + missingParams.join(', ')],
                    });
                    return;
                }
            }

            let isJSON = false;

            if (txn.returns &&
               (txn.returns.$ref || txn.returns.type === 'array' || txn.returns.type === 'object')
            ) {
                isJSON = true; // contract uses JSON serializer so if returns a ref we know it is JSON
            }

            const type: 'evaluateTransaction' | 'submitTransaction' =
                 txn.hasOwnProperty('tag') && txn.tag.includes('submitTx') ?
                    'submitTransaction' : 'evaluateTransaction';

            try {
                let resp = await this.fabricProxy[type](req.user, this.contractName + ':' + txn.name, ...args);

                if (isJSON || forceJSON) {
                    res.setHeader('Content-Type', 'application/json');
                    resp = JSON.parse(resp.toString());
                }

                res.send(resp);
            } catch (err) {
                res.status(400);
                res.send('Error handling transaction. ERROR: ' + err.message);
            }
        };
    }
}
