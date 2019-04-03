/*
SPDX-License-Identifier: Apache-2.0
*/

import { NetworkName } from '../../constants';
import { IState } from '../ledger-api/state';
import { StateList } from '../ledger-api/statelist';
import { VehicleManufactureNetContext } from '../utils/context';
import { Participant } from './participant';

export class ParticipantList extends StateList<Participant> {
    constructor(
        ctx: VehicleManufactureNetContext, listName: string, validTypes: Array<IState<Participant>>,
    ) {
        super(ctx, NetworkName + '.lists.participants.' + listName);
        this.use(...validTypes);
    }
}
