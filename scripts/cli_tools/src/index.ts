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

const version = 'v' + require('../package.json').version;

const results = require('yargs')
    .commandDir('./lib/cmds')
    .demandCommand()
    .help()
    .wrap(null)
    .alias('v', 'version')
    .version(version)
    .describe ('v', 'show version information')
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
