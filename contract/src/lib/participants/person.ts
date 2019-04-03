/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { Participant } from './participant';

const participantType = 'Person';

@Object()
export class Person extends Participant {
    public static getClass() {
        return Participant.generateClass(participantType);
    }

    constructor(id: string) {
        super(id, participantType);
    }
}
