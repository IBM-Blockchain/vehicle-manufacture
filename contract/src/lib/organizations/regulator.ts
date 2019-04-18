/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { Organization } from './organization';

@Object()
export class Regulator extends Organization {
    public static getClass() {
        return Organization.generateClass(Regulator.name);
    }

    constructor(
        id: string, name: string,
    ) {
        super(id, name, Regulator.name);
    }
}
