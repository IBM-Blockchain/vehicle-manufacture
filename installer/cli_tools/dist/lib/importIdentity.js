"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const fabric_network_1 = require("fabric-network");
class ImportIdentity {
    static async import(walletPath, mspid, name, certFile, keyFile) {
        const resolvedPath = path.resolve(process.cwd(), walletPath);
        const walletExists = await fs.pathExists(resolvedPath);
        if (!walletExists) {
            await fs.ensureDir(walletPath);
        }
        let cert;
        let key;
        if (certFile && keyFile) {
            cert = fs.readFileSync(path.resolve(process.cwd(), certFile)).toString();
            key = fs.readFileSync(path.resolve(process.cwd(), keyFile)).toString();
        }
        const wallet = new fabric_network_1.FileSystemWallet(walletPath);
        await wallet.import(name, fabric_network_1.X509WalletMixin.createIdentity(mspid, cert, key));
    }
}
exports.ImportIdentity = ImportIdentity;
