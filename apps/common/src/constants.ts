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
export const CHAINCODE_NAME = 'vehicle-manufacture-chaincode';
export const CHANNEL_NAME = 'vehiclemanufacture';

export const DEFAULT_LOCAL_FABRIC_PATH = './vehiclemanufacture_fabric';
export const DEFAULT_LOCAL_WALLET_PATH = DEFAULT_LOCAL_FABRIC_PATH + '/wallet';
export const DEFAULT_LOCAL_CONNECTION_PATH = DEFAULT_LOCAL_FABRIC_PATH + '/connection.json';

export const CONTRACT_NAMES = {
    participant: 'org.acme.vehicle_network.participants',
    system: 'org.hyperleder.fabric',
    vehicle: 'org.acme.vehicle_network.vehicles',
};
