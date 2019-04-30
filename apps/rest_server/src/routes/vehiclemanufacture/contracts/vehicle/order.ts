import FabricProxy from '../../../../fabricproxy';
import { Request } from '../../../router';
import { Response } from 'express';
import { ContractRouter } from '../contractRouter';

export enum OrderStatus {
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
    }

    public async prepareRoutes() {
        this.router.get('/', await this.transactionToCall('getOrders'));

        this.router.get('/events/placed', (req: Request, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.PLACE_ORDER);
        });

        await this.fabricProxy.addContractListener('system', 'placeOrder', EventNames.PLACE_ORDER, (err, event) => {
            this.publishEvent(event);
        }, {filtered: false});

        this.router.get('/events/updated', (req: Request, res: Response) => {
            this.initEventSourceListener(req, res, this.connections, EventNames.UPDATE_ORDER);
        });

        await this.fabricProxy.addContractListener('system', 'updateOrder', EventNames.UPDATE_ORDER, (err, event) => {
            this.publishEvent(event);
        }, {filtered: false, replay: true});

        this.router.post('/', await this.transactionToCall('placeOrder'));

        this.router.get('/:orderId', await this.transactionToCall('getOrder'));

        this.router.put('/:orderId/status', async (req: Request, res: Response) => {

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

            return (await this.transactionToCall(statusTxMap[status]))(req, res);
        });

        this.router.get('/:orderId/history', await this.transactionToCall('getOrderHistory'));
    }
}
