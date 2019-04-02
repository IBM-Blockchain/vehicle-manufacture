/*
SPDX-License-Identifier: Apache-2.0
*/

import { Participant } from './participant';

export class Company extends Participant {
    private name: string;

    constructor(id: string, name: string, companyType: string) {
        super(id, companyType);
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }
}
