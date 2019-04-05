/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { Company } from './company';

const companyType = 'Manufacturer';

@Object()
export class Manufacturer extends Company {
    public static getClass() {
        return Company.generateClass(companyType);
    }

    @Property('originCode', 'string')
    private _originCode: string;

    @Property('manufacturerCode', 'string')
    private _manufacturerCode: string;

    constructor(
        id: string, name: string,
        originCode: string, manufacturerCode: string,
    ) {
        super(id, name, companyType);
        this._originCode = originCode;
        this._manufacturerCode = manufacturerCode;
    }

    get originCode(): string {
        return this._originCode;
    }

    get manufacturerCode(): string {
        return this._manufacturerCode;
    }
}
