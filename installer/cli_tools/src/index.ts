const version = 'v' + require('../package.json').version;

const results = require('yargs')
    .commandDir('./lib/cmds')
    .demandCommand()
    .help()
    .wrap(null)
    .alias('v', 'version')
    .version(version)
    .describe('v', 'show version information')
    .argv;

if (typeof(results.thePromise) !== 'undefined') {
    results.thePromise.then((data) => {
        console.log('\nCommand succeeded\n');

        if (data) {
            console.log('\nOUTPUT:\n' + data.toString() + '\n');
        }

        process.exit(0);
    }).catch((error) => {
        console.log(error + '\nCommand failed\n');
        process.exit(1);
    });
} else {
    process.exit(0);
}