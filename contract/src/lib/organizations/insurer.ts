/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object } from 'fabric-contract-api';
import { Organization } from './organization';

@Object()
export class Insurer extends Organization {
    public static getClass() {
        return Organization.generateClass(Insurer.name);
    }

    constructor(
        id: string, name: string,
    ) {
        super(id, name, Insurer.name);
    }
}
