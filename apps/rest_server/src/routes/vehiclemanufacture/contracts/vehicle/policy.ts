import FabricProxy from '../../../../fabricproxy';
import { Request } from '../../../router';
import { Response } from 'express';
import { ContractRouter } from '../contractRouter';

const EventNames = {
    PLACE_ORDER: 'PLACE_ORDER',
    UPDATE_ORDER: 'UPDATE_ORDER',
    CREATE_POLICY: 'CREATE_POLICY',
    ADD_USAGE_EVENT: 'ADD_USAGE_EVENT'
};

export class PolicyRouter extends ContractRouter {
    public static basePath = 'policies';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);
    }

    public async prepareRoutes() {
        this.router.post('/', await this.transactionToCall('createPolicy'));

        this.router.get('/events/created', (req: Request, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.CREATE_POLICY);
        });

        this.router.get('/:policyId/usage', await this.transactionToCall('getPolicyEvents'));

        this.fabricProxy.addContractListener('system', 'createPolicy', EventNames.CREATE_POLICY, (err, event, txId, status, blockNumber) => {
            this.publishEvent(event);
        }, null);
    }
}
