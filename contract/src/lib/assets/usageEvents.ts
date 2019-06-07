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
import { Asset } from './asset';

export enum EventType {
    CRASHED = 1,
    OVERHEATED,
    OIL_FREEZING,
    ENGINE_FAILURE,
}

@Object()
export class UsageEvent extends Asset {
    public static getClass() {
        return Asset.generateClass(UsageEvent.name);
    }

    @Property()
    private eventType: EventType;

    @Property()
    private acceleration: number;

    @Property()
    private airTemperature: number;

    @Property()
    private engineTemperature: number;

    @Property()
    private lightLevel: number;

    @Property()
    private pitch: number;

    @Property()
    private roll: number;

    @Property()
    private timestamp: number;

    @Property()
    private vin: string;

    constructor(
        id: string,
        eventType: EventType,
        acceleration: number,
        airTemperature: number,
        engineTemperature: number,
        lightLevel: number,
        pitch: number,
        roll: number,
        timestamp: number,
        vin: string,
    ) {
        super(id, UsageEvent.name);

        this.eventType = eventType;
        this.acceleration = acceleration;
        this.airTemperature = airTemperature;
        this.engineTemperature = engineTemperature;
        this.lightLevel = lightLevel;
        this.pitch = pitch;
        this.roll = roll;
        this.timestamp = timestamp;
        this.vin = vin;
    }
}
