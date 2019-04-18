/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { Participant } from './participant';

const logger = newLogger('TELEMATICS');

@Object()
export class TelematicsDevice extends Participant {
    public static getClass() {
        return Participant.generateClass(TelematicsDevice.name);
    }

    constructor(
        id: string, orgId: string,
    ) {
        super(id, 'telematic', orgId, false, TelematicsDevice.name);
    }
}
