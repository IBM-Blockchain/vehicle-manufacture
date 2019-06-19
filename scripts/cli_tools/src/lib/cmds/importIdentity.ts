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

import { Argv } from 'yargs';
import { ImportIdentity } from '../src/importidentity';

export const command = 'import [options]';

export const desc = 'import admins for letter of credit';

export const builder = (yargs: Argv) => {
    yargs.options({
        'wallet': {
            type: 'string',
            alias: 'w',
            required: true
        },
        'mspid': {
            type: 'string',
            alias: 'm',
            required: true
        },
        'identity-name': {
            type: 'string',
            alias: 'n',
            required: true
        },
        'public-cert': {
            type: 'string',
            alias: 'c',
            required: true
        },
        'private-key': {
            type: 'string',
            alias: 'k',
            required: true
        }
    });
    yargs.usage('loc-cli import --wallet local_fabric/wallet --mspid Org1MSP --identity-name Admin@org1.example.com --public-cert cert.pem --private-key key.pem');

    return yargs;
};

export const handler = (argv: any) => {
    return argv.thePromise = ImportIdentity.import(argv['wallet'], argv['mspid'], argv['identity-name'], argv['public-cert'], argv['private-key']);
}