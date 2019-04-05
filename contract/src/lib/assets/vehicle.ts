/*
SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';
import { Manufacturer } from '../participants/manufacturer';
import { Person } from '../participants/person';
import { Asset } from './asset';
import './usageEvents';
import { IUsageEvent } from './usageEvents';
import { IVehicleDetails } from './vehicleDetails';

export enum VehicleStatus {
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
    private _ownerId: string;

    constructor(
        vin: string, vehicleDetails: IVehicleDetails, vehicleStatus: VehicleStatus, usageRecord: IUsageEvent[],
        ownerId?: string,
    ) {
        super(vin, assetType);

        this.vehicleDetails = vehicleDetails;
        this.vehicleStatus = vehicleStatus;
        this.usageRecord = usageRecord;

        if (ownerId) {
            this._ownerId = ownerId;
        }
    }

    get ownerId(): string {
        return this.ownerId;
    }

    set ownerId(ownerId: string) {
        this._ownerId = ownerId;
    }

    public isOwner(owner: Person) {
        return owner.getClass() === Person.getClass() &&
            owner.id === this.ownerId;
    }

    public isManufacturer(manufacturer: Manufacturer) {
        return manufacturer.getClass() === Manufacturer.getClass() &&
            manufacturer.id === this.vehicleDetails.makeId;
    }
}
