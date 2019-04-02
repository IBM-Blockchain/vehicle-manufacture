/*
SPDX-License-Identifier: Apache-2.0
*/

enum EventType {
    ACTIVATED = 1,
    CRASHED,
    OVERHEATED,
    OIL_FREEZING,
    ENGINE_FAILURE,
  }

export interface IUsageEvent {
    eventID: string;
    eventType: EventType;
    acceleration: number;
    air_temperature: number;
    engine_temperature: number;
    light_level: number;
    pitch: number;
    roll: number;
    timestamp: Date;
}
