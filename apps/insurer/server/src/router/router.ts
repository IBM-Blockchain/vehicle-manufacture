import { Router as CommonRouter, FabricProxy } from 'common';
import { PolicyRouter } from './policy';
import { VehicleRouter } from './vehicle';

export class Router extends CommonRouter {
    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.addSubRouter(PolicyRouter);
        this.addSubRouter(VehicleRouter);
    }
}
