"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const fabric_network_1 = require("fabric-network");
class Enroll {
    static async enrollUsers(walletPath, connectionProfilePath, users, adminName, org) {
        const ccpPath = path.resolve(process.cwd(), connectionProfilePath);
        const ccp = fs.readJSONSync(ccpPath);
        const { admin, ca } = await this.connectAsAdmin(walletPath, ccp, adminName);
        const wallet = this.getWallet(walletPath, org);
        for (let user of users) {
            await this.enrollUser(wallet, user, admin, ca, ccp.organizations[org].mspid, org);
        }
    }
    static getWallet(walletPath, org) {
        // Create a new file system based wallet for managing identities.
        let resolvedPath;
        if (org) {
            resolvedPath = path.resolve(process.cwd(), walletPath, org);
        }
        else {
            resolvedPath = path.resolve(process.cwd(), walletPath);
        }
        return new fabric_network_1.FileSystemWallet(resolvedPath);
    }
    static async connectAsAdmin(walletPath, ccp, adminName) {
        const wallet = this.getWallet(walletPath);
        const adminExists = await wallet.exists(adminName);
        if (!adminExists) {
            throw new Error('Failed to setup admin. Have you enrolled them?');
        }
        const gateway = new fabric_network_1.Gateway();
        await gateway.connect(ccp, { wallet, identity: adminName, discovery: { enabled: false, asLocalhost: true } });
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();
        return { admin: adminIdentity, ca };
    }
    static async enrollUser(wallet, user, admin, ca, mspid, org) {
        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user.name);
        if (userExists) {
            throw new Error('An identity for the user ' + user.name + ' already exists in the wallet');
        }
        const attrs = user.attrs;
        attrs.push({ name: 'locnet.username', value: user.name + '@' + org, ecert: true });
        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: '', enrollmentID: user.name, role: 'client', attrs: attrs }, admin);
        const enrollment = await ca.enroll({ enrollmentID: user.name, enrollmentSecret: secret });
        const userIdentity = fabric_network_1.X509WalletMixin.createIdentity(mspid, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(user.name, userIdentity);
    }
}
exports.Enroll = Enroll;
