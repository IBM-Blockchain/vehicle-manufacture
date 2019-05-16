import { ContractNames, ContractRouter, FabricProxy, IRequest } from 'common';
import { Response } from 'express';
import { v4 } from 'uuid';
import { EventNames } from '../constants';
import { post } from 'request-promise-native';

interface InsuranceRequest {
    requestId: string;
    vin: string;
    holderId: string;
    policyType: number;
    endDate: number;
}

export class PolicyRouter extends ContractRouter {
    public static basePath = 'policies';

    private requestInstances: InsuranceRequest[] = [];

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = ContractNames.vehicle;
    }

    public async prepareRoutes() {
        this.router.get('/', await this.transactionToCall('getPolicies'));

        this.router.post('/', async (req: IRequest, res) => {
            (await this.transactionToCall('createPolicy'))(req, res);

            if (res.statusCode === 200) {
                const { vin, holderId } = req.body;
                for (const id in this.requestInstances) {
                    if (this.requestInstances.hasOwnProperty(id)) {
                        const requestInstance = this.requestInstances[id];
                        if (requestInstance.vin === vin && requestInstance.holderId === holderId) {
                            delete this.requestInstances[id];
                        }
                    }
                }
            }
        });

        this.router.post('/requests', (req: IRequest, res: Response) => {
            const newInsuranceRequest = Object.assign({requestId: v4()}, req.body) as InsuranceRequest;
            this.requestInstances.push(newInsuranceRequest);

            this.publishEvent({
                event_name: EventNames.REQUEST_POLICY,
                chaincodeId: null,
                txId: null,
                payload: Buffer.from(JSON.stringify(newInsuranceRequest))
            });

            res.send();
        });

        this.router.get('/events/requested', (req: IRequest, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.REQUEST_POLICY);

            this.requestInstances.forEach((ri) => this.publishEvent({
                event_name: EventNames.REQUEST_POLICY,
                payload: Buffer.from(JSON.stringify(ri))
            }));
        });

        this.router.get('/events/created', (req, res) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.CREATE_POLICY);
        });

        this.router.delete('/requests/:requestId', (req: IRequest, res: Response) => {
            this.requestInstances = this.requestInstances.filter((request) => {
                return request.requestId !== req.params.requestId;
            });

            res.send();
        });

        this.router.get('/:policyId', await this.transactionToCall('getPolicy'));

        this.router.get('/:policyId/usage', await this.transactionToCall('getPolicyEvents'));

        this.router.post('/:policyId/setup', async (req, res) => {
            const options = {
                body: req.body,
                json: true,
                headers: {
                    'Authorization': 'Basic ' + Buffer.from('prince:princepw').toString('base64')
                }
            };

            try {
                const data = await post('http://arium_app:6001/node-red/api/vin', options);
                res.send(data);
            } catch (err) {
                res.status(500);
                res.send(err.message);
            }
        });

        await this.fabricProxy.addContractListener('admin', 'createPolicy', EventNames.CREATE_POLICY, (err, event, txId, status, blockNumber) => {
            this.publishEvent(event);
        }, {filtered: false, replay: true});
    }
}
