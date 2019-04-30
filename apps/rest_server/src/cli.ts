import * as yargs from 'yargs';
import RestServer from './server';

const results = yargs
    .options({
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
        'port': {
            type: 'number',
            alias: 'p',
            required: false,
            default: 3000
        },
        'org': {
            type: 'string',
            alias: 'o',
            required: true,
            default: 3000
        }
    })
    .help()
    .example('vm-rest-server --wallet ./local_fabric/wallet --connection-profile ./local_fabric/connection_profile.json -p 3000')
    .epilogue('rest server for loc net')
    .alias('v', 'version')
    .describe('v', 'show version information')
    .env('VM_REST')
    .argv;

const server = new RestServer({
    walletPath: results['wallet'],
    connectionProfilePath: results['connection-profile'],
    port: results.port,
    org: results.org
});

try {
    server.start().catch((err) => {
        console.log('SERVER START ERR', err)
        throw err;
    });
} catch (err) {
    console.log('BIG ERROR EXITING', err);
    process.exit(-1);
}