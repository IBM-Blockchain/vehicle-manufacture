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
import FabricProxy from '../fabricproxy';
import { SystemContractRouter } from './system';
import { ParticipantContractRouter } from './user';
import { BaseRouter } from './utils/router';

export * from './system';
export * from './user';

export class Router extends BaseRouter {
    private fabricProxy: FabricProxy;

    constructor(fabricProxy: FabricProxy) {
        super();

        this.fabricProxy = fabricProxy;
        this.subRouters = [SystemContractRouter, ParticipantContractRouter];
    }

    public async prepareRoutes() {
        for (const subRouterClass of this.subRouters) {
            const subRouter = new subRouterClass(this.fabricProxy);

            await subRouter.prepareRoutes();

            this.router.use('/' + subRouterClass.basePath, subRouter.getRouter());
        }
    }
}
