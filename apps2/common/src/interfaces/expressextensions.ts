import { Request as ExpressRequest, Router as ExpressRouter } from 'express';

export interface IRequest extends ExpressRequest {
    user?: string;
}

export interface IRouter {
    getRouter(): ExpressRouter;
    prepareRoutes(): Promise<void>;
}
