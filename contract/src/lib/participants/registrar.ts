/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { Roles } from '../../constants';
import { Participant } from './participant';

const logger = newLogger('ADMIN');

@Object()
export class Registrar extends Participant {
    public static getClass() {
        return Participant.generateClass(Registrar.name);
    }

    constructor(
        id: string, orgId: string,
    ) {
        super(id, [Roles.PARTICIPANT_CREATE], orgId, Registrar.name);
    }
}
