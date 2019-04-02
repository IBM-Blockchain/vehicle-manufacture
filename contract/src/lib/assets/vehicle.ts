/*
SPDX-License-Identifier: Apache-2.0
*/

import { IUsageEvent } from '../interfaces/usageEvents';
import { IVehicleDetails } from '../interfaces/vehicleDetails';
import { Person } from '../participants/person';
import { Asset } from './asset';

enum VehicleStatus {
    ACTIVE = 0,
    OFF_THE_ROAD,
    SCRAPPED,
}

export class Vehicle extends Asset {
    private vehicleDetails: IVehicleDetails;
    private vehicleStatus: VehicleStatus;
    private usageRecord: IUsageEvent[];
    private owner: Person;

    constructor(
        vin: string, vehicleDetails: IVehicleDetails, vehicleStatus: VehicleStatus, usageRecord: IUsageEvent[],
        owner?: Person,
    ) {
        super(vin, 'Vehicle');

        this.vehicleDetails = vehicleDetails;
        this.vehicleStatus = vehicleStatus;
        this.usageRecord = usageRecord;

        if (owner) {
            this.owner = owner;
        }
    }
}
