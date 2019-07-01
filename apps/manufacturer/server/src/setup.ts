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

import { CONTRACT_NAMES, FabricProxy } from 'common';
import { SERVER_CONFIG } from './constants';

async function main() {
    const fabricProxy = new FabricProxy(SERVER_CONFIG);

    try {
        await fabricProxy.submitTransaction(
            'registrar', CONTRACT_NAMES.participant + ':provideManufacturerDetails', 'S', 'G',
        );
        console.log('Successfully provided manufacturer details');
    } catch (err) {
        console.error('ERROR PROVIDING MANUFACTURER DETAILS', err);
    }
}

main();
