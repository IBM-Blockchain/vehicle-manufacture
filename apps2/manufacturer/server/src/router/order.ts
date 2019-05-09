import { ContractRouter, FabricProxy, ContractNames, IRequest } from 'common';
import { Response } from 'express';
import { v1 } from 'uuid';

enum OrderStatus {
    PLACED = 0,
    SCHEDULED_FOR_MANUFACTURE,
    VIN_ASSIGNED,
    OWNER_ASSIGNED,
    DELIVERED,
}

const EventNames = {
    PLACE_ORDER: 'PLACE_ORDER',
    UPDATE_ORDER: 'UPDATE_ORDER',
    CREATE_POLICY: 'CREATE_POLICY',
    ADD_USAGE_EVENT: 'ADD_USAGE_EVENT'
};

const statusTxMap = {
    [OrderStatus.SCHEDULED_FOR_MANUFACTURE]: 'scheduleOrderForManufacture',
    [OrderStatus.VIN_ASSIGNED]: 'registerVehicleForOrder',
    [OrderStatus.OWNER_ASSIGNED]: 'assignOwnershipForOrder',
    [OrderStatus.DELIVERED]: 'deliverOrder'
}

export class OrderRouter extends ContractRouter {
    public static basePath = 'orders';

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = ContractNames.vehicle;
    }

    public async prepareRoutes() {
        this.router.get('/', await this.transactionToCall('getOrders'));
        
        this.router.post('/', await this.transactionToCall('placeOrder'));
        
        this.router.get('/:orderId', await this.transactionToCall('getOrder'));

        this.router.put('/:orderId/status', async (req: IRequest, res: Response) => {
            if (!req.body.hasOwnProperty('status')) {
                res.status(400);
                res.send('Bad request. Missing parameters: status');
                return;
            }

            const status = parseInt(String(req.body.status));

            if (isNaN(status) || status <= OrderStatus.PLACED || status > OrderStatus.DELIVERED) {
                res.status(400);
                res.send('Bad request. Invalid parameters: status');
                return;
            }

            if (status === OrderStatus.VIN_ASSIGNED) {
                const telematicDevice = {
                    name: 'telematic-'+v1(),
                    attrs: [{
                        name: 'vehicle_manufacture.role',
                        value: 'telematic',
                        ecert: true
                    }]
                }

                // generate telematic device using common
                req.body.telematicId = telematicDevice.name + '@Arium';
            }

            (await this.transactionToCall(statusTxMap[status]))(req, res);
        });

        this.router.get('/:orderId/history', await this.transactionToCall('getOrderHistory'));

        this.router.get('/events/placed', (req: IRequest, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.PLACE_ORDER);
        });

        await this.fabricProxy.addContractListener('admin', 'placeOrder', EventNames.PLACE_ORDER, (err, event) => {
            this.publishEvent(event);
        }, {filtered: false});

        this.router.get('/events/updated', (req: IRequest, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.UPDATE_ORDER);
        });

        await this.fabricProxy.addContractListener('admin', 'updateOrder', EventNames.UPDATE_ORDER, (err, event) => {
            this.publishEvent(event);
        }, {filtered: false, replay: true});
    }
}
