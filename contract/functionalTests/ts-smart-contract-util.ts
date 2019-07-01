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

import * as fabricNetwork from 'fabric-network';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { URL } from 'url';

import { User } from 'fabric-client';
import * as InMemoryCheckpointer from 'fabric-network/test/impl/event/inmemorycheckpointer';
import * as os from 'os';
import * as path from 'path';

export class SmartContractUtil {

    public static async getConnectionProfile(connectionProfilePath?: string) {
        const homedir = os.homedir();
        if (!connectionProfilePath) {
            connectionProfilePath = path.join(homedir, '.fabric-vscode', 'runtime', 'gateways', 'local_fabric.json');
        }
        const connectionProfileContents: any = await fs.readFile(connectionProfilePath, 'utf8');
        if (connectionProfilePath.endsWith('.json')) {
            return JSON.parse(connectionProfileContents);
        } else if (connectionProfilePath.endsWith('.yaml') || connectionProfilePath.endsWith('.yml')) {
            return yaml.safeLoad(connectionProfileContents);
        }
    }

    public static async submitTransaction(
        contractName: string,
        functionName: string,
        args: string[],
        gateway: fabricNetwork.Gateway,
    ): Promise<Buffer> {
        // Submit transaction
        const network: fabricNetwork.Network = await gateway.getNetwork('vehiclemanufacture');
        let contract: fabricNetwork.Contract;
        if (contractName !== '') {
            contract = await network.getContract('vehicle-manufacture-chaincode', contractName);
        } else {
            contract = await network.getContract('vehicle-manufacture-chaincode');
        }

        const responseBuffer: Buffer = await contract.submitTransaction(functionName, ...args);
        return JSON.parse(responseBuffer.toString());
    }

public static async evaluateTransaction(
    contractName: string,
    functionName: string,
    args: string[],
    gateway: fabricNetwork.Gateway,
    ): Promise<Buffer> {
        // Submit transaction
        const network: fabricNetwork.Network = await gateway.getNetwork('vehiclemanufacture');
        let contract: fabricNetwork.Contract;
        if (contractName !== '') {
            contract = await network.getContract('vehicle-manufacture-chaincode', contractName);
        } else {
            contract = await network.getContract('vehicle-manufacture-chaincode');
        }

        const responseBuffer: Buffer = await contract.evaluateTransaction(functionName, ...args);
        return JSON.parse(responseBuffer.toString());
    }

    // Checks if URL is localhost
    public static isLocalhostURL(url: string): boolean {
        const parsedURL: URL = new URL(url);
        const localhosts: string[] = [
            'localhost',
            '127.0.0.1',
        ];
        return localhosts.indexOf(parsedURL.hostname) !== -1;
    }

    // Used for determining whether to use discovery
    public static hasLocalhostURLs(profile: any): boolean {
        const urls: string[] = [];
        for (const nodeType of ['orderers', 'peers', 'certificateAuthorities']) {
            if (!profile[nodeType]) {
                continue;
            }
            const nodes: any = profile[nodeType];
            for (const nodeName in nodes) {
                if (!nodes[nodeName].url) {
                    continue;
                }
                urls.push(nodes[nodeName].url);
            }
        }
        return urls.some((url: string) => this.isLocalhostURL(url));
    }

    public static async createGateway(connectionProfile, identity, wallet, {discoveryAsLocalhost, discoveryEnabled}) {
        const gateway = new fabricNetwork.Gateway();
        const options: fabricNetwork.GatewayOptions = {
            checkpointer: {
                factory: (channelName, listenerName, opts) => {
                    return new InMemoryCheckpointer();
                },
                options: {},
            },
            clientTlsIdentity: identity,
            discovery: {
                asLocalhost: discoveryAsLocalhost,
                enabled: discoveryEnabled,
            },
            identity,
            wallet,
        };

        await gateway.connect(connectionProfile, options);
        const ca = gateway.getClient().getCertificateAuthority();
        const user = gateway.getCurrentIdentity();

        return gateway;
    }
}
