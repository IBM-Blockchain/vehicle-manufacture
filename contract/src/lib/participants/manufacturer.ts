/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { Company } from './company';

const companyType = 'Manufacturer';

@Object()
export class Manufacturer extends Company {
    public static getClass() {
        return Company.generateClass(companyType);
    }

    constructor(id: string, name: string) {
        super(id, name, companyType);
    }
}
