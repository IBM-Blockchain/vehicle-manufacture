/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as config from 'config'

const app = express() as any;
const server = http.createServer(app);

let restServerConfig;

try {
    restServerConfig = config.get('restServer')
} catch (err) {
    if (!process.env.REST_SERVER_CONFIG) {
        throw new Error('Cannot get restServer config, the config file may not exist');
    }
    restServerConfig = {}
}

if (process.env.REST_SERVER_CONFIG) {
  restServerConfig = process.env.REST_SERVER_CONFIG;
}

var insurerConfig;

try {
  insurerConfig = config.get('insurer');
} catch (err) {
  if (!process.env.INSURER_CONFIG) {
    throw new Error('Cannot get insurer from config, the config file may not exist. Provide this file or a value for INSURER_CONFIG');
  }
  insurerConfig = {};
}

if (process.env.INSURER_CONFIG ) {
    insurerConfig = process.env.INSURER_CONFIG;
}

app.get('/assets/config.json', (req, res, next) => {
  res.json({
    restServer: restServerConfig,
    insurer: insurerConfig
  });
});

// static - all our js, css, images, etc go into the assets path
app.use(express.static(path.join(__dirname, 'www')));

// start server on the specified port
server.listen(8100, function () {
  'use strict';
  // print a message when the server starts listening
  console.log('server starting on http://localhost:8100');
});