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

import { NetworkName } from '../../constants';
import { Asset } from '../assets/asset';
import { IState } from '../ledger-api/state';
import { StateList } from '../ledger-api/statelist';
import { VehicleManufactureNetContext } from '../utils/context';

export class AssetList<T extends Asset> extends StateList<T> {
    constructor(ctx: VehicleManufactureNetContext, listName: string, validTypes: Array<IState<T>>) {
        super(ctx, NetworkName + '.lists.assets.' + listName);
        this.use(...validTypes);
    }
}
