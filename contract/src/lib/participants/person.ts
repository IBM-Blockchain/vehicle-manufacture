/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { Participant } from './participant';

const logger = newLogger('PERSON');

@Object()
export class Person extends Participant {
    public static getClass() {
        return Participant.generateClass(Person.name);
    }

    constructor(
        id: string, role: string, orgId: string, canRegister: boolean,
    ) {
        super(id, role, orgId, canRegister, Person.name);
    }
}
