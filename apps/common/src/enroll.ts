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
import * as fs from 'fs-extra';
import * as path from 'path';

import { IKeyValueAttribute } from 'fabric-ca-client';
import { User } from 'fabric-client';
import { FileSystemWallet, Gateway, Wallet, X509WalletMixin } from 'fabric-network';

export interface IVMUser {
    name: string;
    attrs: IKeyValueAttribute[];
}

export class Enroll {
    public static async enrollUser(
        wallet: string | Wallet,
        connectionProfile: string | any,
        user: IVMUser, adminName: string,
        org: string) {
        if (typeof connectionProfile === 'string') {
            const ccpPath = path.resolve(process.cwd(), connectionProfile);
            connectionProfile = fs.readJSONSync(ccpPath);
        }

        const {admin, ca} = await this.connectAsAdmin(wallet, connectionProfile, adminName);

        if (typeof wallet === 'string') {
            wallet = this.getWallet(wallet);
        }
        await this._enrollUser(wallet, user, admin, ca, connectionProfile.organizations[org].mspid, org);
    }

    private static getWallet(walletPath: string): FileSystemWallet {
        // Create a new file system based wallet for managing identities.
        let resolvedPath;

        resolvedPath = path.resolve(process.cwd(), walletPath);

        return new FileSystemWallet(resolvedPath);
    }

    private static async connectAsAdmin(wallet: string | Wallet, ccp: object, adminName: string)
    : Promise<{admin: User, ca: any}> {
        if (typeof wallet === 'string') {
            wallet = this.getWallet(wallet);
        }

        const adminExists = await wallet.exists(adminName);

        if (!adminExists) {
            throw new Error('Failed to setup admin. Have you enrolled them?');
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            clientTlsIdentity: adminName,
            discovery: { enabled: false  },
            identity: adminName,
            wallet,
        });

        const ca = gateway.getClient().getCertificateAuthority();

        const adminIdentity = gateway.getCurrentIdentity();

        return {admin: adminIdentity, ca};
    }

    private static async _enrollUser(
        wallet: FileSystemWallet,
        user: IVMUser,
        admin: User,
        ca: any,
        mspid: string,
        org: string): Promise<void> {
        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user.name);
        if (userExists) {
            throw new Error('An identity for the user ' + user.name + ' already exists in the wallet');
        }

        const attrs = user.attrs;
        attrs.push({name: 'vehicle_manufacture.username', value: user.name + '@' + org, ecert: true});

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: '', enrollmentID: user.name, role: 'client', attrs }, admin);

        const enrollment = await ca.enroll({ enrollmentID: user.name, enrollmentSecret: secret });

        const userIdentity = X509WalletMixin.createIdentity(mspid, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(user.name, userIdentity);
    }
}
