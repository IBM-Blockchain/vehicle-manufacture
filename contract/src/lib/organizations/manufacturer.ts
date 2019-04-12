/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { Organization } from './organization';

@Object()
export class Manufacturer extends Organization {
    public static getClass() {
        return Organization.generateClass() + '.manufacturer';
    }
    @Property('originCode', 'string')
    public originCode: string;

    @Property('manufacturerCode', 'string')
    public manufacturerCode: string;

    constructor(
        id: string, name: string,
        originCode: string, manufacturerCode: string,
    ) {
        super(id, name, 'manufacturer');
        this.originCode = originCode;
        this.manufacturerCode = manufacturerCode;
    }
}
