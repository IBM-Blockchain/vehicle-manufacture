"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enroll_1 = require("../enroll");
const fs = require("fs-extra");
exports.command = 'enroll [options]';
exports.desc = 'enroll users for letter of credit';
exports.builder = (yargs) => {
    yargs.options({
        'wallet': {
            type: 'string',
            alias: 'w',
            required: true
        },
        'connection-profile': {
            type: 'string',
            alias: 'c',
            required: true
        },
        'users': {
            type: 'string',
            alias: 'u',
            required: true
        },
        'admin': {
            type: 'string',
            alias: 'a',
            required: true
        },
        'organisation': {
            type: 'string',
            alias: 'o',
            required: true
        }
    });
    yargs.usage('loc-cli enroll --wallet local_fabric/wallet --connection-profile local_fabric/connection.json --users users.json --admin Admin@org1.example.com --organisation Org1');
    return yargs;
};
exports.handler = (argv) => {
    const users = fs.readJSONSync(argv['users']);
    return argv.thePromise = enroll_1.Enroll.enrollUsers(argv['wallet'], argv['connection-profile'], users, argv['admin'], argv['organisation']);
};
