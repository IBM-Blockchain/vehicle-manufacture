import { Request, Response } from 'express';
import FabricProxy from '../fabricproxy';

export const handleRouterCall = async (req: Request, res: Response, fabricProxy: FabricProxy, functionName: string, args: Array<string>, type: 'evaluateTransaction'| 'submitTransaction', isJSON: boolean = false ) => {
    try {
        const user = getAuth(req);

        let resp = await fabricProxy[type](user, functionName, ...args);
        
        if (isJSON) {
            res.setHeader('Content-Type', 'application/json');
            resp = JSON.parse(resp.toString());
        }

        res.send(resp);
    } catch (err) {
        res.status(400);
        res.send('Error handling transaction. ERROR: ' + err.message);
    }
}

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
