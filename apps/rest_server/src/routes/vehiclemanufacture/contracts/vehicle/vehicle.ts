import { Response } from 'express';
import FabricProxy from '../../../../fabricproxy';
import { Request } from './../../../router';
import { ContractRouter } from '../contractRouter';

const EventNames = {
    PLACE_ORDER: 'PLACE_ORDER',
    UPDATE_ORDER: 'UPDATE_ORDER',
    CREATE_POLICY: 'CREATE_POLICY',
    ADD_USAGE_EVENT: 'ADD_USAGE_EVENT'
};

export class VehicleRouter extends ContractRouter {
    public static basePath = 'vehicles';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);
    }

    public async prepareRoutes() {
        this.router.get('/', await this.transactionToCall('getVehicles'));

        this.router.get('/:vin', await this.transactionToCall('getVehicle'));

        this.router.get('/:vin/usage', await this.transactionToCall('getUsageEvents'));

        this.router.post('/:vin/usage', await this.transactionToCall('addUsageEvent'));

        this.router.get('/usage/events/added', (req: Request, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.ADD_USAGE_EVENT);
        });

        this.fabricProxy.addContractListener('system', 'addUsageEvent', EventNames.ADD_USAGE_EVENT, (err, event) => {
            this.publishEvent(event);
        }, null);
    }
}
