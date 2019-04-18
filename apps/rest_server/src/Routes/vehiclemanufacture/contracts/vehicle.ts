import { Router } from 'express';
import FabricProxy from '../../../fabricproxy';
import { ChaincodeMetadata } from '../../../interfaces/metadata_interfaces';
import { Router as IRouter } from '../../../interfaces/router';
import { handleRouterCall, transactionToCall } from '../../utils';
import { SystemContractRouter } from './system';
import { ParticipantContractRouter } from './participants';

export enum OrderStatus {
    PLACED = 0,
    SCHEDULED_FOR_MANUFACTURE,
    VIN_ASSIGNED,
    OWNER_ASSIGNED,
    DELIVERED,
}

const statusTxMap = {
    [OrderStatus.SCHEDULED_FOR_MANUFACTURE]: 'scheduleOrderForManufacture',
    [OrderStatus.VIN_ASSIGNED]: 'registerVehicleForOrder',
    [OrderStatus.OWNER_ASSIGNED]: 'assignOwnershipForOrder',
    [OrderStatus.DELIVERED]: 'deliverOrder'
}

export class VehicleContractRouter implements IRouter {
    public static contractName = 'org.acme.vehicle_network.vehicles';

    private router: Router;
    private fabricProxy: FabricProxy;

    constructor(fabricProxy: FabricProxy) {
        this.router = Router();
        this.fabricProxy = fabricProxy;
    }

    public async prepareRoutes() {
        this.router.get('/orders', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, VehicleContractRouter.contractName + ':' + 'getOrders', [], 'evaluateTransaction', true);
        });

        this.router.post('/orders', await this.transactionToCall('placeOrder'));

        this.router.get('/orders/:orderId', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, VehicleContractRouter.contractName + ':' + 'getOrder', [req.params.orderId], 'evaluateTransaction', true);
        });

        this.router.put('/orders/:orderId/status', async (req, res) => {
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

        this.router.get('/vehicles', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, VehicleContractRouter.contractName + ':' + 'getVehicles', [], 'evaluateTransaction', true);
        });

        this.router.get('/vehicles/:vin', (req, res) => {
            handleRouterCall(req, res, this.fabricProxy, VehicleContractRouter.contractName + ':' + 'getVehicle', [req.params.vin], 'evaluateTransaction', true);
        });

        this.router.post('/policies', await this.transactionToCall('createPolicy'));

        this.router.post('/vehicles/:vin/usage', await this.transactionToCall('addUsageEvent'));
    }

    public getRouter(): Router {
        return this.router;
    }

    private async transactionToCall(transactionName: string) {
        return await transactionToCall(this.fabricProxy, transactionName, VehicleContractRouter.contractName)
    }
}
