import { SystemContractRouter, Router as CommonRouter, FabricProxy } from 'common';
import { OrderRouter } from './order';
import { ParticipantContractRouter } from './users';
import { VehicleRouter } from './vehicle';

export class Router extends CommonRouter {
    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.subRouters = [SystemContractRouter, ParticipantContractRouter , OrderRouter, VehicleRouter];
    }
}