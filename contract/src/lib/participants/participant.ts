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
