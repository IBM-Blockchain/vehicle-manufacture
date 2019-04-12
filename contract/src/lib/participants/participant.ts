/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object as ContractObject, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

const logger = newLogger('PARTICIPANT');

@ContractObject()
export class Participant extends State {
    public static generateClass(participantType: string): string {
        return NetworkName + '.participants.'  + participantType;
    }

    @Property('id', 'string')
    public id: string;

    @Property('orgName', 'string')
    public orgName: string;

    @Property('orgType', 'string')
    public orgType: string;

    @Property('role', 'string')
    public role: string;

    constructor(id: string, orgName: string, orgType: string, role: string, participantType: string) {
        super(Participant.generateClass(participantType), [id]);
        this.id = id;
        this.orgName = orgName;
        this.orgType = orgType;
        this.role = role;
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
}
