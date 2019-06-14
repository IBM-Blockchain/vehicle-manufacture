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
import * as x509 from '@ampretia/x509';
import { Request } from 'express';
import FabricProxy from './fabricproxy';
import { IUser } from './interfaces/users';

export const extensionKey = '1.2.3.4.5.6.7.8.1';

export default class Utils {
    public static certToUser(certificate: string): IUser {
        const cert = x509.parseCert(certificate);
        const attrs = JSON.parse(cert.extensions[extensionKey]).attrs;

        const user: IUser = {
            company: attrs['vehicle_manufacture.company'],
            role: attrs['vehicle_manufacture.role'],
        };

        return user;
    }

    public static getAuth(req: Request): string {
        const auth = req.headers.authorization;

        if (!auth) {
            throw new Error('Missing auth: ' + JSON.stringify(req.headers));
        } else if (!auth.includes('Basic ')) {
            throw new Error('Expected Basic auth');
        }

        const [user, pwd] = new Buffer(auth.replace('Basic ', ''), 'base64').toString().split(':');

        // pretend to do something with username and password like a proper server

        return user;
    }

    public static upperFirstChar(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
