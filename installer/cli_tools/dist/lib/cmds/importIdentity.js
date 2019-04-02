"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const importIdentity_1 = require("../importIdentity");
exports.command = 'import [options]';
exports.desc = 'import admins for letter of credit';
exports.builder = (yargs) => {
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
exports.handler = (argv) => {
    return argv.thePromise = importIdentity_1.ImportIdentity.import(argv['wallet'], argv['mspid'], argv['identity-name'], argv['public-cert'], argv['private-key']);
};
