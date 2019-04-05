/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { Participant } from './participant';

const participantType = 'Person';

const logger = newLogger('PERSON');

@Object()
export class Person extends Participant {
    public static getClass() {
        return Participant.generateClass(participantType);
    }

    constructor(id: string) {
        super(id, participantType);

        logger.info('THE ID ' + id);
    }
}
