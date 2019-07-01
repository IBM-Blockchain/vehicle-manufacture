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

import { Object, Property } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

@Object()
export class Organization extends State {
    public static generateClass(orgType: string): string {
        return NetworkName + '.organizations.' + orgType;
    }

    @Property()
    public readonly id: string;

    @Property()
    public readonly name: string;

    constructor(
        id: string,
        name: string,
        orgType: string,
     ) {
        super(Organization.generateClass(orgType), [id]);
        this.id = id;
        this.name = name;
    }
}
