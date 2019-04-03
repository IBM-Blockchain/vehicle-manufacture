/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';

@Object()
export class IVehicleDetails {
    @Property()
    public makeId: string;

    @Property()
    public modelType: string;

    @Property()
    public colour: string;
}
