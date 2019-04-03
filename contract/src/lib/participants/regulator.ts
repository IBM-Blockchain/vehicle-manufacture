/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { Company } from './company';

const companyType = 'Regulator';

@Object()
export class Regulator extends Company {
    public static getClass() {
        return Company.generateClass(companyType);
    }

    constructor(id: string, name: string) {
        super(id, name, companyType);
    }
}
