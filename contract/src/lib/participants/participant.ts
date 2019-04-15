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

    @Property()
    public id: string;

    @Property()
    public orgName: string;

    @Property()
    public orgType: string;

    @Property()
    public role: string;

    @Property()
    public canRegister: boolean = false;

    constructor(
        id: string, role: string, orgType: string, orgName: string, canRegister: boolean, participantType: string,
    ) {
        super(Participant.generateClass(participantType), [id]);
        this.id = id;
        this.role = role;
        this.orgType = orgType;
        this.orgName = orgName;
        this.canRegister = canRegister;
    }

    public isManufacturer() {
        return this.orgType === 'manufacturer';
    }

    public isRegulator() {
        return this.orgType === 'regulator';
    }

    public isInsurer() {
        return this.orgType === 'insurer';
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
