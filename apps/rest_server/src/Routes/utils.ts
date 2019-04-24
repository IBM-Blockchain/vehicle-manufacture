import { Request, Response } from 'express';
import FabricProxy from '../fabricproxy';

export const getAuth = (req: Request): string => {
    const auth = req.headers.authorization;

    if (!auth) {
        throw new Error('Missing auth')
    } else if (!auth.includes('Basic ')) {
        throw new Error('Expected Basic auth')
    }

    const [user, pwd] = new Buffer(auth.replace('Basic ', ''), 'base64').toString().split(':');

    // pretend to do something with username and password like a proper server

    return user;
}

export const upperFirstChar = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
