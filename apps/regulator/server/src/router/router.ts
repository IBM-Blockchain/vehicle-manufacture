import { Router as CommonRouter, FabricProxy } from 'common';
import { HistoryRouter } from './history';

export class Router extends CommonRouter {
    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.addSubRouter(HistoryRouter);
    }
}