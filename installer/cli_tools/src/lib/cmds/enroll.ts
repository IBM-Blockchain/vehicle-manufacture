import { Enroll, LocUser } from '../enroll';
import { Argv } from 'yargs';
import * as fs from 'fs-extra';

export const command = 'enroll [options]';

export const desc = 'enroll users for letter of credit';

export const builder = (yargs: Argv) => {
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

export const handler = (argv: any) => {
    const users: Array<LocUser> = fs.readJSONSync(argv['users']);

    return argv.thePromise = Enroll.enrollUsers(argv['wallet'], argv['connection-profile'], users, argv['admin'], argv['organisation']);
}