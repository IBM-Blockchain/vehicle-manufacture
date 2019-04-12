/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { Participant } from './participant';

const participantType = 'Person';

const logger = newLogger('PERSON');

@Object()
export class Person extends Participant {
    public static getClass() {
        return Participant.generateClass(participantType);
    }

    public static getSubClasses() {
        return [];
    }

    constructor(id: string, orgName: string, orgType: string, role: string) {
        super(id, orgName, orgType, role, participantType);
    }
}
