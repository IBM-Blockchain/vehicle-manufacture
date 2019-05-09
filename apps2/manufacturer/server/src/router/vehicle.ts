import { ContractRouter, FabricProxy, ContractNames, IRequest } from 'common';
import { Response } from 'express';

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

        this.contractName = ContractNames.vehicle;
    }

    public async prepareRoutes() {
        this.router.get('/usage', await this.transactionToCall('getUsageEvents'));

        this.router.post('/:vin/usage', async (req: IRequest, res) => {
            console.log(req.body);
            (await this.transactionToCall('addUsageEvent'))(req, res)
        });

        this.router.get('/:vin/telemetry', (req, res) => {
            console.log('CONNECTED', req.params.vin);
            this.initEventSourceListener(req, res, this.connections, req.params.vin + '-TELEMETRY');
        })

        this.router.post('/:vin/telemetry', (req, res) => {
            this.publishEvent({
                event_name: req.params.vin + '-TELEMETRY',
                payload: Buffer.from(JSON.stringify(req.body)),
            });
        });

        this.router.get('/usage/events/added', (req: IRequest, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.ADD_USAGE_EVENT);
        });

        await this.fabricProxy.addContractListener('admin', 'addUsageEvent', EventNames.ADD_USAGE_EVENT, (err, event) => {
            this.publishEvent(event);
        }, {filtered: false, replay: true});
    }
}