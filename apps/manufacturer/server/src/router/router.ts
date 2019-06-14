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
import { SystemContractRouter, Router as CommonRouter, FabricProxy } from 'common';
import { OrderRouter } from './order';
import { ParticipantContractRouter } from './users';
import { VehicleRouter } from './vehicle';

export class Router extends CommonRouter {
    constructor(fabricProxy: FabricProxy) {
        super(fabricProxy);

        this.subRouters = [SystemContractRouter, ParticipantContractRouter , OrderRouter, VehicleRouter];
    }
}