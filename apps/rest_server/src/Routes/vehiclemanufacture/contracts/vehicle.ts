import FabricProxy from '../../../fabricproxy';
import { OrderRouter } from './vehicle/order';
import { PolicyRouter } from './vehicle/policy';
import { VehicleRouter } from './vehicle/vehicle';
import { ContractRouter } from './contractRouter';

const contractName = 'org.acme.vehicle_network.vehicles'

export class VehicleContractRouter extends ContractRouter {
    public static basePath = contractName;

    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.contractName = contractName;

        this.subRouters = [OrderRouter, PolicyRouter, VehicleRouter];
    }
}
