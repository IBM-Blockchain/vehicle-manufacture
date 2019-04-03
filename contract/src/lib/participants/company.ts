/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { Participant } from './participant';

@Object()
export class Company extends Participant {
    @Property()
    private name: string;

    constructor(id: string, name: string, companyType: string) {
        super(id, companyType);
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }
}
