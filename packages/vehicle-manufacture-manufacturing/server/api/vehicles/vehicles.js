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
var request = require('request')
var config = require('config');

var manufacturer = 'Arium';

var get = (req, res) => {

  var restServerConfig = req.app.get('config').restServer;
  var composerBaseURL = restServerConfig.httpURL;
  var vehicleEndpoint = composerBaseURL + '/Vehicle'

  var filter = {
    "include": "resolve"
  }

  request.get({
    url: `${vehicleEndpoint}?filter=${JSON.stringify(filter)}`,
    json: true
  }, (err, response, vehicles) => {
    let response_data = [];

    // QUICK FIX WHILST ALL REST SERVER DATA COMES FROM ADMIN
    vehicles.forEach(vehicle => {
      if(vehicle.vehicleDetails.make.name === manufacturer) {
        response_data.push(vehicle);
      }
    });
    res.send(response_data);
  })
}

var get_id = (req, res) => {

  var restServerConfig = req.app.get('config').restServer;
  var composerBaseURL = restServerConfig.httpURL;
  var vehicleEndpoint = composerBaseURL + '/Vehicle/' + req.params.id;

  var filter = {
    "include": "resolve"
  }

  request.get({
    url: `${vehicleEndpoint}?filter=${JSON.stringify(filter)}`,
    json: true
  }, (err, response, vehicle) => {
    if(err) {
      res.status(500).send(err.message);
      return;
    }
    // QUICK FIX WHILST ALL REST SERVER DATA COMES FROM ADMIN
    if(vehicle.vehicleDetails.make.name === manufacturer) {
      res.send(vehicle);
    } else {
      res.status(500).send(`Unknown "Vehicle" id "${req.params.id}".`);
    }
  })
}

module.exports = {
  get: get,
  get_id: get_id
}
