import { BaseRouter, Request } from '../../router';
import FabricProxy from '../../../fabricproxy';
import { Response } from 'express';

export abstract class ContractRouter extends BaseRouter {
    private _contractName: string;

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);
    }

    public async prepareRoutes() {
        for (const SubRouter of this.subRouters) {
            const subRouter = new SubRouter(this.fabricProxy);

            if (subRouter instanceof ContractRouter) {
                subRouter.contractName = this.contractName;
            }

            await subRouter.prepareRoutes();

            this.router.use('/' + SubRouter.basePath, subRouter.getRouter());
        }
    }

    protected get contractName(): string {
        if (!this._contractName) {
            throw new Error('Tried to get contract name before it was set');
        }

        return this._contractName;
    }

    protected set contractName(contractName: string) {
        this._contractName = contractName
    }

    protected async transactionToCall(transactionName: string, forceJSON: boolean = false): Promise<(req: Request, res: Response) => void> {
        const metadata = await this.fabricProxy.getMetadata();

        if (!metadata.contracts.hasOwnProperty(this.contractName)) {
            throw new Error(`Failed to find contract with name ${this.contractName} in metadata`);
        }

        const contractMetadata = metadata.contracts[this.contractName];
        const transaction = contractMetadata.transactions.find((transaction) => transaction.name === transactionName);

        if (!transaction) {
            throw new Error(`Transaction ${transactionName} not found in metadata for contract ${this.contractName}`);
        }

        return async (req, res) => {
            const args = [];

            if (transaction.parameters) {
                const missingParams = [];

                transaction.parameters.forEach((param) => {
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

            if (transaction.returns && (transaction.returns.$ref || transaction.returns.type === 'array' || transaction.returns.type === 'object')) {
                isJSON = true; // contract uses JSON serializer so if returns a ref we know it is JSON
            }

            const type: 'evaluateTransaction' | 'submitTransaction' = transaction.hasOwnProperty('tag') && transaction.tag.includes('submitTx') ? 'submitTransaction' : 'evaluateTransaction';

            try {
                let resp = await this.fabricProxy[type](req.user, this.contractName + ':' + transaction.name, ...args);

                if (isJSON || forceJSON) {
                    res.setHeader('Content-Type', 'application/json');
                    resp = JSON.parse(resp.toString());
                }

                res.send(resp);
            } catch (err) {
                res.status(400);
                res.send('Error handling transaction. ERROR: ' + err.message);
            }
        }
    }
}
