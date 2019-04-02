/*
SPDX-License-Identifier: Apache-2.0
*/

import { Company } from './company';

export class Regulator extends Company {
    constructor(id: string, name: string) {
        super(id, name, 'Regulator');
    }
}
