/*
SPDX-License-Identifier: Apache-2.0
*/

import { Company } from './company';

export class Insurer extends Company {
    constructor(id: string, name: string) {
        super(id, name, 'Insurer');
    }
}
