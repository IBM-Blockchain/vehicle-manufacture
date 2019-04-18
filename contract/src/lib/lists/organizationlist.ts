/*
SPDX-License-Identifier: Apache-2.0
*/

import { NetworkName } from '../../constants';
import { IState } from '../ledger-api/state';
import { StateList } from '../ledger-api/statelist';
import { Organization } from '../organizations/organization';
import { VehicleManufactureNetContext } from '../utils/context';

export class OrganizationList extends StateList<Organization> {
    constructor(ctx: VehicleManufactureNetContext, listName: string, validTypes: Array<IState<Organization>>) {
        super(ctx, `${NetworkName}.lists.${listName}`);
        this.use(...validTypes);
    }
}
