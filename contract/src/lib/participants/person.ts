/*
SPDX-License-Identifier: Apache-2.0
*/

import { Participant } from './participant';

export class Person extends Participant {
    constructor(id: string) {
        super(id, 'Person');
    }
}
