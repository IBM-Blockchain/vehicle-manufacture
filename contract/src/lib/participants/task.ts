/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { Participant } from './participant';

const logger = newLogger('TASK');

@Object()
export class Task extends Participant {
    public static getClass() {
        return Participant.generateClass(Task.name);
    }

    constructor(
        id: string, roles: string[], orgId: string,
    ) {
        super(id, roles, orgId, Task.name);
    }
}
