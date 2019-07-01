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
'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
import * as x509 from '@ampretia/x509';
import { Block, Channel } from 'fabric-client';
import { Contract, FileSystemCheckpointer, FileSystemWallet, Gateway, Network } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';
import { GenesisCheckpointer } from './checkpointer';
import { IFabricConfig } from './interfaces/config';
import { IChaincodeMetadata } from './interfaces/metadata';
import { IUser } from './interfaces/users';
import Utils from './utils';

export interface ITransaction {
    timestamp: number;
    contract: string;
    name: string;
    parameters: {
        [s: string]: any;
    };
    txId: string;
    caller: {
        identity: string;
        msp: string;
    };
}

export interface IBlock {
    number: number;
    transactions: any[];
}

export default class FabricProxy {

    public readonly ccp: any;
    public readonly wallet: FileSystemWallet;
    private config: IFabricConfig;

    constructor(config: IFabricConfig) {

        const walletpath = path.resolve(process.cwd(), config.walletPath);

        this.wallet = new FileSystemWallet(walletpath);
        this.config = config;

        const ccpPath = path.resolve(process.cwd(), config.connectionProfilePath);
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        this.ccp = JSON.parse(ccpJSON);
    }

    public async getUser(username: string): Promise<IUser> {
        if (!(await this.wallet.exists(username))) {
            throw new Error('could not find identity in wallet: ' + username);
        }

        const identity = await this.wallet.export(username) as any;

        return Utils.certToUser(identity.certificate);
    }

    public async getMetadata(user: string = 'admin'): Promise<IChaincodeMetadata> {
        const metadataBuff = await this.evaluateTransaction(user, 'org.hyperledger.fabric:GetMetadata');
        return JSON.parse(metadataBuff.toString()) as IChaincodeMetadata;
    }

    public async evaluateTransaction(user: string, functionName: string, ...args: string[]): Promise<Buffer> {
        return this.handleTransaction('evaluateTransaction', user, functionName, ...args);
    }

    public async submitTransaction(user: string, functionName: string, ...args: string[]): Promise<Buffer> {
        return this.handleTransaction('submitTransaction', user, functionName, ...args);
    }

    public async addContractListener(
        user: string, listenerName: string, eventName: string, callback: any, options: any,
    ) {
        const gateway: Gateway = await this.setupGateway(user);
        const contract = await this.getContract(gateway);
        options = Object.assign(this.getCheckpointerOptions(), options);

        await contract.addContractListener(listenerName, eventName, callback, options);
    }

    public async addBlockListener(
        user: string, listenerName: string, callback: any, options: any,
    ) {
        const gateway: Gateway = await this.setupGateway(user);
        const network = await this.getNetwork(gateway);
        options = Object.assign(this.getCheckpointerOptions(), options);

        await network.addBlockListener(listenerName, (async (err, block: Block) => {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, this.formatBlock(block,  await this.getMetadata(user)));
        }) as any, options);
    }

    public async getHistory(user: string, options: any): Promise<IBlock[]> {
        const gateway: Gateway = await this.setupGateway(user);
        const network: Network = await this.getNetwork(gateway);

        const channel: Channel = network.getChannel();

        const metadata = await this.getMetadata();

        const info = await channel.queryInfo();
        const height = (info.height as Long).toInt();

        options = Object.assign({
            checkpointer: {
                factory: () => {
                    return new GenesisCheckpointer();
                },
                options: {},
            },
        }, options);

        let list: any;

        const blocks: IBlock[] = [];

        await new Promise(async (resolve , reject) => {
            const callback = async (err, block: Block): Promise<any> => {
                if (err) {
                    return reject(err);
                }

                blocks.push(this.formatBlock(block, metadata));

                if (Number(block.header.number) === height - 1) { // *1 as actually a string
                    resolve(true);
                }
            };

            list = await network.addBlockListener('block-history-' + new Date().getTime(), callback as any, options);

        });

        list.unregister();

        return blocks;
    }

    private async handleTransaction(
        type: 'evaluateTransaction'| 'submitTransaction', user: string, functionName: string, ...args: string[]
    ): Promise<Buffer> {
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
            const network = await this.getNetwork(gateway);
            return await network.getContract(this.config.contractName);
        } catch (err) {
            throw new Error('Error connecting to channel. Does channel name exist? ERROR:' + err.message);
        }
    }

    private async getNetwork(gateway: Gateway): Promise<Network> {
        try {
            return await gateway.getNetwork(this.config.channelName);
        } catch (err) {
            throw new Error('Error connecting to channel. Does channel name exist? ERROR:' + err.message);
        }
    }

    private async setupGateway(user: string): Promise<Gateway> {
        try {
            const gateway = new Gateway();
            // Set connection options; use 'admin' identity from application wallet
            const connectionOptions = {
                clientTlsIdentity: user,
                discovery: {enabled: false},
                identity: user,
                wallet: this.wallet,
            };

            // console.log('CONNECTION', connectionOptions);

            // Connect to gateway using application specified parameters
            await gateway.connect(this.ccp, connectionOptions);
            return gateway;
        } catch (error) {
            throw error;
        }
    }

    private getCheckpointerOptions(): any {
        return {
            checkpointer: {
                factory: (channelName, fListenerName, fOptions) => {
                    return new FileSystemCheckpointer(channelName, fListenerName, fOptions);
                },
                options: {basePath: `checkpointers/${this.config.org}-checkpointer`},
            },
        };
    }

    private formatBlock(block: Block, metadata: IChaincodeMetadata): IBlock {
        let blockTransactions: ITransaction[] = [];

        block.data.data.forEach((data) => {
            if (data.payload.data.hasOwnProperty('actions')) {
                const date = new Date(data.payload.header.channel_header.timestamp);

                const timestamp = date.getTime();
                const txId = data.payload.header.channel_header.tx_id;

                data.payload.data.actions.forEach((action) => {
                    const callArgs =
                        action.payload.chaincode_proposal_payload.input.chaincode_spec.input.args.map(
                            (arg) => {
                                return arg.toString();
                            },
                    );

                    const nsFcn = /([^:]*)(?::|^)(.*)/g.exec(callArgs[0]);
                    const params = callArgs.slice(1);

                    let contractName = nsFcn[1];
                    const functionName = nsFcn[2];

                    if (!contractName || contractName.trim() === '') {
                        for (const key in metadata.contracts) {
                            if (metadata.contracts[key].contractInstance.default) {
                                contractName = key;
                            }
                        }
                    }

                    const contract = metadata.contracts[contractName];

                    const transactionMetadata = contract.transactions.find((transaction) => {
                        return transaction.name === functionName;
                    });

                    const formattedParams = {};

                    params.forEach((param, index) => {
                        let value = param;

                        if (transactionMetadata.parameters[index].schema.type !== 'string') {
                            value = JSON.parse(param); // MAKING ASSUMPTION THAT CONTRACT
                                                        // IS USING STANDARD JSON PARSER OF CONTRACT API
                        }

                        formattedParams[transactionMetadata.parameters[index].name] = value;
                    });

                    const x509Cert = x509.parseCert(action.header.creator.IdBytes.toString());

                    blockTransactions.push({
                        caller: {
                            identity: x509Cert.subject.commonName,
                            msp: action.header.creator.Mspid,
                        },
                        contract: contractName,
                        name: functionName,
                        parameters: formattedParams,
                        timestamp,
                        txId,
                    });
                });
            }
        });

        // REMOVE INVALID TRANSACTIONS
        blockTransactions = blockTransactions.filter((_, index) => {
            return block.metadata.metadata[2][index] === 0;
        });

        return {
            number: Number(block.header.number), // *1 as actually a string
            transactions: blockTransactions,
        };
    }
}
