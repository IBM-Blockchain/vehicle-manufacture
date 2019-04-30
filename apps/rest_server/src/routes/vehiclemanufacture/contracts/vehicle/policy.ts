import FabricProxy from '../../../../fabricproxy';
import { Request } from '../../../router';
import { Response } from 'express';
import { ContractRouter } from '../contractRouter';
import { v4 } from 'uuid';

const EventNames = {
    PLACE_ORDER: 'PLACE_ORDER',
    UPDATE_ORDER: 'UPDATE_ORDER',
    CREATE_POLICY: 'CREATE_POLICY',
    REQUEST_POLICY: 'REQUEST_POLICY',
    ADD_USAGE_EVENT: 'ADD_USAGE_EVENT',
    INSURE_ME: 'INSURE_ME'
};

interface InsuranceRequest {
    requestId: string;
    vin: string;
    holderId: string;
    policyType: number;
    endDate: number;
}

let requestInstances: InsuranceRequest[] = [];

export class PolicyRouter extends ContractRouter {
    public static basePath = 'policies';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);
    }

    public async prepareRoutes() {
        this.router.post('/', async (req: Request, res) => {
            console.log('MAKING A POLICY');

            (await this.transactionToCall('createPolicy'))(req, res);

            if (res.statusCode === 200) {
                const { vin, holderId } = req.body;
                for (const id in requestInstances) {
                    const requestInstance = requestInstances[id]
                    if (requestInstance.vin === vin && requestInstance.holderId === holderId) {
                        delete requestInstances[id];
                    }
                }
            }
        });

        this.router.get('/', await this.transactionToCall('getPolicies'));

        this.router.get('/events/created', (req: Request, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.CREATE_POLICY);
        });

        this.router.get('/events/requested', (req: Request, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.REQUEST_POLICY);

            requestInstances.forEach((ri) => this.publishEvent({
                event_name: EventNames.REQUEST_POLICY,
                chaincodeId: null,
                txId: null,
                payload: Buffer.from(JSON.stringify(ri))
            }));
        });

        this.router.post('/requests', (req: Request, res: Response) => {
            const newInsuranceRequest = Object.assign({requestId: v4()}, req.body) as InsuranceRequest;
            requestInstances.push(newInsuranceRequest);
            
            this.publishEvent({
                event_name: EventNames.REQUEST_POLICY,
                chaincodeId: null,
                txId: null,
                payload: Buffer.from(JSON.stringify(newInsuranceRequest))
            });

            res.send();
        });

        this.router.delete('/requests/:requestId', (req: Request, res: Response) => {
            requestInstances = requestInstances.filter((request) => {
                return request.requestId !== req.params.requestId;
            });

            res.send();
        });

        this.router.get('/:policyId', await this.transactionToCall('getPolicy'));

        this.router.get('/:policyId/usage', await this.transactionToCall('getPolicyEvents'));

        await this.fabricProxy.addContractListener('system', 'createPolicy', EventNames.CREATE_POLICY, (err, event, txId, status, blockNumber) => {
            this.publishEvent(event);
        }, {filtered: false, replay: true});
    }
}
