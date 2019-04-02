/*
SPDX-License-Identifier: Apache-2.0
*/

import { Company } from './company';

export class Manufacturer extends Company {
    constructor(id: string, name: string) {
        super(id, name, 'Manufacturer');
    }
}
