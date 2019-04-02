import * as path from 'path';
import * as fs from 'fs-extra';
import { FileSystemWallet, X509WalletMixin, Gateway } from 'fabric-network';

export class ImportIdentity {
    public static async import(walletPath: string, mspid: string, name: string, certFile: string, keyFile: string) {
        const resolvedPath = path.resolve(process.cwd(), walletPath);

        const walletExists: boolean = await fs.pathExists(resolvedPath);
        if (!walletExists) {
            await fs.ensureDir(walletPath);
        }

        let cert: string;
        let key: string;

        if (certFile && keyFile) {
            cert = fs.readFileSync(path.resolve(process.cwd(), certFile)).toString();
            key = fs.readFileSync(path.resolve(process.cwd(), keyFile)).toString();
        }

        const wallet: FileSystemWallet = new FileSystemWallet(walletPath);
        await wallet.import(name, X509WalletMixin.createIdentity(mspid, cert, key))
    }
}
