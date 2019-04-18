/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { Organization } from './organization';

const logger = newLogger('MANUFACTURER');

@Object()
export class Manufacturer extends Organization {
    public static getClass() {
        return Organization.generateClass(Manufacturer.name);
    }
    @Property()
    public originCode: string;

    @Property()
    public manufacturerCode: string;

    constructor(
        id: string, name: string,
        originCode: string, manufacturerCode: string,
    ) {
        super(id, name, Manufacturer.name);

        this.originCode = originCode;
        this.manufacturerCode = manufacturerCode;
    }
}
