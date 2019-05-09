import { ContractRouter, FabricProxy, ContractNames, IRequest } from 'common';
import { Response } from 'express';
import { v4 } from 'uuid';
import { EventNames } from '../constants';

interface InsuranceRequest {
    requestId: string;
    vin: string;
    holderId: string;
    policyType: number;
    endDate: number;
}

export class VehicleRouter extends ContractRouter {
    public static basePath = 'vehicles';

    private requestInstances: InsuranceRequest[] = [];

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = ContractNames.vehicle;
    }

    public async prepareRoutes() {
        this.router.get('/usage', await this.transactionToCall('getUsageEvents'));

        this.router.get('/usage/events/added', (req: IRequest, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.ADD_USAGE_EVENT);
        });

        this.router.get('/:vin', await this.transactionToCall('getVehicle'));

        await this.fabricProxy.addContractListener('admin', 'addUsageEvent', EventNames.ADD_USAGE_EVENT, (err, event) => {
            this.publishEvent(event);
        }, {filtered: false, replay: true});
    }
}
