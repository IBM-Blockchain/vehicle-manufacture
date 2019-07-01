/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
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
