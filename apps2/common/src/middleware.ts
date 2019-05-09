import * as bodyParser from 'body-parser';
import * as express from 'express';
import { IRequest } from './interfaces';
import Utils from './utils';

export function setupMiddleware(app: express.Application) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    return app;
}

export const authHandlerFactory = (getAuth: (req: IRequest) => string = Utils.getAuth) => {
    return (req: IRequest, res, next) => {
        if (!req.url.includes('events')) {
            // hack - cannot add auth via EventSource could mess around with cookies for handling auth instead
            try {
                req.user = getAuth(req);
            } catch (err) {
                return next(err);
            }
        }
        next();
    };
};
