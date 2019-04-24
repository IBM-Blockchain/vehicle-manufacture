import { Router as ExpressRouter, Request, Response } from 'express'

export interface Router {
    getRouter(): ExpressRouter;
    prepareRoutes(): Promise<void>;
}

