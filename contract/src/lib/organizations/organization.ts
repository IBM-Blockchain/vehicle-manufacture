/*
SPDX-License-Identifier: Apache-2.0
*/

import { Property } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';
import { NotRequired } from '../utils/annotations';

const assetType = 'Organization';

export class Organization extends State {
    public static generateClass(): string {
        return NetworkName + '.organization';
    }

    public static getClass() {
        return Organization.generateClass();
    }

    @Property('id', 'string')
    public id: string;

    @Property('name', 'string')
    public name: string;

    @Property('orgType', 'string')
    public orgType: string;

    @Property('originCode', 'string')
    public originCode: string;

    @Property('manufacturerCode', 'string')
    public manufacturerCode: string;

    constructor(
        id: string,
        name: string,
        orgType: string,
        @NotRequired originCode?: string,
        @NotRequired manufacturerCode?: string,
     ) {
        super(Organization.generateClass(), [id]);
        this.id = id;
        this.name = name;
        this.orgType = orgType;
        this.originCode = originCode;
        this.manufacturerCode = manufacturerCode;
    }

    public getName() {
        return this.name;
    }
}
