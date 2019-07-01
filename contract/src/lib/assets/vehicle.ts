/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Object, Property } from 'fabric-contract-api';
import { Manufacturer } from '../organizations/manufacturer';
import { NotRequired } from '../utils/annotations';
import { Asset } from './asset';
import { IVehicleDetails } from './vehicleDetails';

export enum VehicleStatus {
    ACTIVE = 0,
    OFF_THE_ROAD,
    SCRAPPED,
}

@Object()
export class Vehicle extends Asset {
    public static getClass() {
        return Asset.generateClass(Vehicle.name);
    }

    public static validateVin(vin: string, manufacturer: Manufacturer, validationYear: number): boolean {
        const yearChars = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y',
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ];

        const yearChar = yearChars[(validationYear - 1980) % yearChars.length];
        return vin.length === 17 &&
            vin.charAt(0) === manufacturer.originCode &&
            vin.charAt(1) === manufacturer.manufacturerCode &&
            vin.charAt(9) === yearChar;
    }

    @Property()
    private vehicleDetails: IVehicleDetails;

    private _vehicleStatus: VehicleStatus;

    private _ownerId: string;

    @Property()
    private manufactured: number;

    constructor(
        id: string,
        vehicleDetails: IVehicleDetails,
        vehicleStatus: VehicleStatus,
        manufactured: number,
        @NotRequired ownerId?: string,
    ) {
        super(id, Vehicle.name);

        this.vehicleDetails = vehicleDetails;
        this._vehicleStatus = vehicleStatus;
        this.manufactured = manufactured;

        if (ownerId) {
            this._ownerId = ownerId;
        }
    }

    @Property()
    get ownerId(): string {
        return this._ownerId;
    }

    set ownerId(ownerId: string) {
        this._ownerId = ownerId;
    }

    @Property()
    get vehicleStatus(): VehicleStatus {
        return this._vehicleStatus;
    }

    set vehicleStatus(status: VehicleStatus) {
        this._vehicleStatus = status;
    }

    public madeByOrg(orgId: string) {
        return this.vehicleDetails.makeId === orgId;
    }
}
