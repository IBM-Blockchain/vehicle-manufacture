/*
SPDX-License-Identifier: Apache-2.0
*/

import { ParticipantsContract } from './lib/contracts/participants';
import { VehicleContract } from './lib/contracts/vehicle';
import { JSONSerializer } from './serializer';

export const contracts: any[] = [ VehicleContract, ParticipantsContract ];
export const serializers = {
    serializers: {
        customSerializer: JSONSerializer,
    },
    transaction: 'customSerializer',
};
