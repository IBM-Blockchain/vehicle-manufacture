/*
SPDX-License-Identifier: Apache-2.0
*/

import { Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

const logger = newLogger('PARTICIPANT');

export class Participant extends State {
    public static generateClass(participantType: string): string {
        return NetworkName + '.participants.'  + participantType;
    }

    @Property()
    public id: string;

    @Property()
    public role: string;

    @Property()
    public canRegister: boolean = false;

    @Property()
    public orgId: string;

    constructor(
        id: string, role: string, orgId: string, canRegister: boolean, participantType: string,
    ) {
        super(Participant.generateClass(participantType), [id]);
        this.id = id;
        this.role = role;
        this.orgId = orgId;
        this.canRegister = canRegister;
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
