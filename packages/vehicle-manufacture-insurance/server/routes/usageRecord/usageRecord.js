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
var request = require('request');

var get = (req, res) => {

    var restServerConfig = req.app.get('config').restServer;
    var composerBaseURL = restServerConfig.httpURL;
    var filter = {
        "include": "resolve"
    }
    var endpoint = composerBaseURL + `/Policy?filter=${JSON.stringify(filter)}`;

    var usageRecords = [];

    request.get({
        url: endpoint,
        json: true
    }, (err, response, body) => {
        for (let i = 0; i < body.length; i++) {
        let vehicle = body[i].vehicle;

        vehicle.usageRecord.forEach((record) => {
            usageRecords.push(record);
        });
        }
        res.send(usageRecords)
    });
}

module.exports = {
    get: get
}