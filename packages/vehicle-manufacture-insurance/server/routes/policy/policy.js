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

var get = (req, res) => {

  var restServerConfig = req.app.get('config').restServer;
  var composerBaseURL = restServerConfig.httpURL;
  var endpoint = composerBaseURL + '/Policy';

  request.get({
    url: endpoint,
    json: true
  }, (err, response, body) => {
    res.send(body)
  })
}

var get_id = (req, res) => {

  var restServerConfig = req.app.get('config').restServer;
  var composerBaseURL = restServerConfig.httpURL;

  var filter = {
    "include": "resolve"
  }

  var endpoint = composerBaseURL + `/Policy/${req.params.id}?filter=${JSON.stringify(filter)}`;

  request.get({
    url: endpoint,
    json: true
  }, (err, response, body) => {
    if(err) {
      res.status(500).send(err.message);
    } else {
      res.send(body);
    }
  });
}

var post = (req, res) => {

  var restServerConfig = req.app.get('config').restServer;
  var composerBaseURL = restServerConfig.httpURL;
  var endpoint = composerBaseURL + '/CreatePolicy';

  if(!req.body) {
    res.status(400).send('Body must be provided');
    return;
  }

  var options = {
    method: 'POST',
    url: endpoint,
    headers: {
       'Content-Type': 'application/json'
    },
    body: Object.assign({'$class': 'org.acme.vehicle_network.CreatePolicy'}, req.body),
    json: true
  };

  request(options, (err, response, body) => {
      if(err) {
        res.status(500).send(err.message);
      } else {
        res.send(body);
      }
  });
}

module.exports = {
  get: get,
  get_id: get_id,
  post: post
}