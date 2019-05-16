import * as path from 'path';
import * as fs from 'fs-extra';

import { FileSystemWallet, Gateway, X509WalletMixin, Wallet } from 'fabric-network';
import { User } from 'fabric-client';
import { IKeyValueAttribute } from 'fabric-ca-client';

export interface VMUser {
    name: string;
    attrs: Array<IKeyValueAttribute>
}

export class Enroll {
    public static async enrollUser(wallet: string | Wallet, connectionProfile: string | any, user: VMUser, adminName: string, org: string) {
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

    private static async connectAsAdmin(wallet: string | Wallet, ccp: object, adminName: string): Promise<{admin: User, ca: any}> {
        if (typeof wallet === 'string') {
            wallet = this.getWallet(wallet);
        }

        const adminExists = await wallet.exists(adminName);

        if (!adminExists) {
        	throw new Error('Failed to setup admin. Have you enrolled them?');
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: adminName, discovery: { enabled: false ,  asLocalhost: true } });

        const ca = gateway.getClient().getCertificateAuthority();

        const adminIdentity = gateway.getCurrentIdentity();

        return {admin: adminIdentity, ca};
    }

    private static async _enrollUser(wallet: FileSystemWallet, user: VMUser, admin: User, ca: any, mspid: string, org: string): Promise<void> {
        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user.name);
        if (userExists) {
            throw new Error('An identity for the user ' + user.name + ' already exists in the wallet');
        }

        const attrs = user.attrs;
        attrs.push({name: 'vehicle_manufacture.username', value: user.name + '@' + org, ecert: true})

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: '', enrollmentID: user.name, role: 'client', attrs: attrs }, admin);

        const enrollment = await ca.enroll({ enrollmentID: user.name, enrollmentSecret: secret });

        const userIdentity = X509WalletMixin.createIdentity(mspid, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(user.name, userIdentity);
    }
}