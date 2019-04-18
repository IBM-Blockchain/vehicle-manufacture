import { Request, Response } from 'express';
import FabricProxy from '../fabricproxy';
import { TransactionMetadata } from '../interfaces/metadata_interfaces';

export const handleRouterCall = async (req: Request, res: Response, fabricProxy: FabricProxy, functionName: string, args: Array<string>, type: 'evaluateTransaction'| 'submitTransaction', isJSON: boolean = false ) => {
    try {
        const user = getAuth(req);

        let resp = await fabricProxy[type](user, functionName, ...args);

        if (isJSON) {
            res.setHeader('Content-Type', 'application/json');
            resp = JSON.parse(resp.toString());
        }


        res.send(resp);
    } catch (err) {
        res.status(400);
        res.send('Error handling transaction. ERROR: ' + err.message);
    }
}

export const getAuth = (req: Request): string => {
    const auth = req.headers.authorization;

        if (!auth) {
            throw new Error('Missing auth')
        } else if (!auth.includes('Basic ')) {
            throw new Error('Expected Basic auth')
        }

        const [user, pwd] = new Buffer(auth.replace('Basic ', ''), 'base64').toString().split(':');

        // pretend to do something with username and password like a proper server

        return user;
}

export const transactionToCall = async (fabricProxy: FabricProxy, transactionName: string, contractName: string) => {
    const metadata = await fabricProxy.getMetadata();
    const contractMetadata = metadata.contracts[contractName];
    const transaction = contractMetadata.transactions.find((transaction) => transaction.name === transactionName);

    if (!transaction) {
        throw new Error(`Transaction ${transactionName} not found in metadata for contract ${contractName}`);
    }

    return (req, res) => {
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

        handleRouterCall(req, res, fabricProxy, contractName + ':' + transaction.name, args, 'submitTransaction', isJSON)
    }
};

export const upperFirstChar = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
