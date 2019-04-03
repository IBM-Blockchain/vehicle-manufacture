'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

// Bring key classes into scope, most importantly Fabric SDK network class
import { Contract, FileSystemWallet, Gateway, Network } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import { FabricConfig } from './interfaces/config';
import { User } from './interfaces/users';
import Utils from './utils';

export default class FabricProxy {

    private wallet: FileSystemWallet;
    private config: FabricConfig;

    private ccp: any;

    constructor(config: FabricConfig) {

        const walletpath = path.resolve(process.cwd(), config.walletPath);

        this.wallet = new FileSystemWallet(walletpath);
        this.config = config;

        const ccpPath = path.resolve(process.cwd(), config.connectionProfilePath);
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        this.ccp = JSON.parse(ccpJSON);
    }

    public async getUser(username: string): Promise<User> {
        if (!(await this.wallet.exists(username))) {
            throw new Error('could not find identity in wallet: ' + username);
        }

        const identity = await this.wallet.export(username) as any;

        return Utils.certToUser(identity.certificate)
    }

    public async evaluateTransaction(user: string, functionName: string, ...args: Array<string>): Promise<Buffer> {
        return this.handleTransaction('evaluateTransaction', user, functionName, ...args);
    }

    public async submitTransaction(user: string, functionName: string, ...args: Array<string>): Promise<Buffer> {
        return this.handleTransaction('submitTransaction', user, functionName, ...args);
    }

    public async addContractListener(user: string, listenerName: string, eventName: string, callback: any, options: any) {
        const gateway: Gateway = await this.setupGateway(user);
        const contract = await this.getContract(gateway);

        const list: any = await contract.addContractListener(listenerName, eventName, callback, options);
    
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (list.eventHub.isconnected()) {
                    clearInterval(interval);
                    resolve(true)
                }
            }, 2000);
        });
    }

    public async getTransaction(user: string, txId: string): Promise<any> {
        const gateway: Gateway = await this.setupGateway(user);
        const network = await  gateway.getNetwork(this.config.channelName);

        return network.getChannel().queryTransaction(txId);
    }

    private async handleTransaction(type: 'evaluateTransaction'| 'submitTransaction', user: string, functionName: string, ...args: string[]): Promise<Buffer> {
        try {
            const gateway: Gateway = await this.setupGateway(user);
            const contract: Contract = await this.getContract(gateway);
            const buff: Buffer = await contract[type](`${functionName}`, ...args);
            
            gateway.disconnect();

            return buff;
        } catch (error) {
            throw error;
        }
    }

    private async getContract(gateway: Gateway): Promise<Contract> {
        try {
            const network: Network = await gateway.getNetwork(this.config.channelName);
            return await network.getContract(this.config.contractName);
        } catch (err) {
            throw new Error('Error connecting to channel. Does channel name exist? ERROR:' + err.message);
        }
    }

    private async setupGateway(user: string): Promise<Gateway> {
        try {
            const gateway = new Gateway();
            // Set connection options; use 'admin' identity from application wallet
            const connectionOptions = {
                discovery: {enabled: false},
                identity: user,
                wallet: this.wallet,
            };

            // Connect to gateway using application specified parameters
            await gateway.connect(this.ccp, connectionOptions);
            return gateway;
        } catch (error) {
            throw error;
        }
    }
}
