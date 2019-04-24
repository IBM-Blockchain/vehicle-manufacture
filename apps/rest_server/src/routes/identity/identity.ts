import FabricProxy from '../../fabricproxy';
import { BaseRouter, Request } from '../router';
import { Enroll, VMUser } from 'vehicle-manufacture-contract-wallet-api';
import { v1 } from 'uuid';

export class IdentityRouter extends BaseRouter {
    public static basePath = 'wallet';

    constructor (fabricProxy:FabricProxy) {
        super(fabricProxy);

        this.subRouters = [];
    }

    public async prepareRoutes() {
        this.router.post('/devices/telematic', async (req: Request, res, next) => {
            try {
                const user: VMUser = {
                    name: v1(),
                    attrs: [{
                        "name": "vehicle_manufacture.role",
                        "value": "telematic",
                        "ecert": true
                    }]
                }
    
                await Enroll.enrollUser(this.fabricProxy.wallet, this.fabricProxy.ccp, user, req.user, this.fabricProxy.ccp.client.organization);
    
                res.json(user);
            } catch (err) {
                res.status(400);
                res.send('Error creating identity for telematic device: ' + err.message);
            }
        });
    }
}