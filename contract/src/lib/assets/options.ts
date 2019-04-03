import { Object, Property } from 'fabric-contract-api';

/*
SPDX-License-Identifier: Apache-2.0
*/

@Object()
export class IOptions {
    @Property()
    public trim: string;

    @Property()
    public interior: string;

    @Property('extras', 'string[]')
    public extras: string[];
}
