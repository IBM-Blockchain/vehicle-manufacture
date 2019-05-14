import { BaseRouter } from 'common';
import { OrderRouter } from './order';
import { PolicyRouter } from './policy';

export class Router extends BaseRouter {
    constructor() {
        console.log('CALLED');
        super();

        this.subRouters = [OrderRouter, PolicyRouter];
    }
}