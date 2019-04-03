import { Router as ExpressRouter } from 'express'

export interface Router {
    getRouter(): ExpressRouter;
    prepareRoutes(): Promise<void>;
}