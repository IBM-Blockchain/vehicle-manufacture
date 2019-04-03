/*
SPDX-License-Identifier: Apache-2.0
*/

import { ParticipantsContract } from './lib/contracts/participants';
import { VehicleContract } from './lib/contracts/vehicle';

console.log('I AM A TEAPOT');

export const contracts: any[] = [ VehicleContract, ParticipantsContract ];
