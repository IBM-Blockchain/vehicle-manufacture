/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { Person } from '../participants/person';
import { Asset } from './asset';
import { IUsageEvent } from './usageEvents';
import { IVehicleDetails } from './vehicleDetails';

enum VehicleStatus {
    ACTIVE = 0,
    OFF_THE_ROAD,
    SCRAPPED,
}

const assetType = 'Vehicle';

@Object()
export class Vehicle extends Asset {
    public static getClass() {
        return Asset.generateClass(assetType);
    }

    @Property()
    private vehicleDetails: IVehicleDetails;

    @Property()
    private vehicleStatus: VehicleStatus;

    @Property('usageRecord', 'IUsageEvent[]')
    private usageRecord: IUsageEvent[];

    @Property()
    private owner: Person;

    constructor(
        vin: string, vehicleDetails: IVehicleDetails, vehicleStatus: VehicleStatus, usageRecord: IUsageEvent[],
        owner?: Person,
    ) {
        super(vin, assetType);

        this.vehicleDetails = vehicleDetails;
        this.vehicleStatus = vehicleStatus;
        this.usageRecord = usageRecord;

        if (owner) {
            this.owner = owner;
        }
    }
}
