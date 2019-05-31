/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { NetworkName } from '../../constants';
import { State } from '../ledger-api/state';

@Object()
export class Organization extends State {
    public static generateClass(orgType: string): string {
        return NetworkName + '.organizations.' + orgType;
    }

    @Property('id', 'string')
    public id: string;

    @Property('name', 'string')
    public name: string;

    @Property('originCode', 'string')
    public originCode: string;

    @Property('manufacturerCode', 'string')
    public manufacturerCode: string;

    constructor(
        id: string,
        name: string,
        orgType: string,
     ) {
        super(Organization.generateClass(orgType), [id]);
        this.id = id;
        this.name = name;
    }

    public getName() {
        return this.name;
    }
}
