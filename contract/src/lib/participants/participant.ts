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

import { Object as ContractObject, Property } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

@ContractObject()
export class Participant extends State {
    public static generateClass(participantType: string): string {
        return NetworkName + '.participants.'  + participantType;
    }

    @Property()
    public readonly id: string;

    @Property()
    public readonly orgId: string;

    @Property('roles', 'string[]')
    protected roles: string[];

    constructor(
        id: string, roles: string[], orgId: string, participantType: string,
    ) {
        super(Participant.generateClass(participantType), [id]);
        this.id = id;
        this.roles = roles;
        this.orgId = orgId;
    }

    public serialize(): Buffer {
        const toSerialize = JSON.parse(State.serialize(this).toString());

        Object.keys(this).forEach((key) => {
            if (key.startsWith('_')) {
                Object.defineProperty(toSerialize, key.slice(1), Object.getOwnPropertyDescriptor(toSerialize, key));
                delete toSerialize[key];
            }
        });

        return Buffer.from(State.serialize(toSerialize));
    }

    public hasRole(role: string): boolean {
        return this.roles.includes(role);
    }
}
