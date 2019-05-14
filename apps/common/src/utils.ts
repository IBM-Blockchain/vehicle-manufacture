import * as x509 from '@ampretia/x509';
import { Request } from 'express';
import { Enroll, VMUser } from 'vehicle-manufacture-contract-wallet-api';
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
