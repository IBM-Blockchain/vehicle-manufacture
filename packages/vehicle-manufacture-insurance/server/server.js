// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
var url = require('url');
var config = require('config');

// Get our API routes
const api = require('./routes/api');

const app = express();
const server = http.createServer(app);

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(path.join(__dirname, '../dist')));

// Set our api routes
app.use('/api', api);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

var nodeRedConfig = Object.assign({}, config.get('nodeRed'));
if (process.env.NODE_RED_CONFIG ) {
  try {
    var nodeRedEnv = JSON.parse(process.env.NODE_RED_CONFIG);
    nodeRedConfig = Object.assign(nodeRedConfig, nodeRedEnv); // allow for them to only specify some fields
  } catch (err) {
    console.error('Error getting rest config from env vars, using default');
  }
}
app.set('config', {
  nodeRed: nodeRedConfig
})

var restServerConfig = Object.assign({}, config.get('restServer'));
if (process.env.REST_SERVER_CONFIG ) {
  try {
    var restServerEnv = JSON.parse(process.env.REST_SERVER_CONFIG);
    restServerConfig = Object.assign(restServerConfig, restServerEnv); // allow for them to only specify some fields
  } catch (err) {
    console.error('Error getting rest config from env vars, using default');
  }
}
app.set('config', {
  restServer: restServerConfig
})

var wss = new WebSocket.Server({ server: server });
wss.on('connection', function (ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  console.log('client connected', location.pathname);
  ws.on('close', function (code, reason) {
    console.log('client closed', location.pathname, code, reason);
  });
  ws.on('message', function (data) {
    wss.clients.forEach((client) => {
      try {
        client.send(data);
        nodeRemote.send(data);
      } catch (err) {
        // ignore
      }
    })
  });
  
  var remoteURL = restServerConfig.webSocketURL + location.pathname;
  console.log('creating remote connection', remoteURL);
  var remote = new WebSocket(remoteURL);
  remote.on('open', function () {
    console.log('remote open', location.pathname);
  })
  remote.on('close', function (code, reason) {
    console.log('remote closed', location.pathname, code, reason);
    ws.close();
  });
  remote.on('message', function (data) {
    console.log('message from remote', data);
    try {
      ws.send(data);
    } catch(err) {
      console.log('You need to refresh your connection');
    }
  });
  remote.on('error', function (data) {
    console.log('AN ERROR OCCURED: ', data);
    ws.close();
  });

  var nodeRemoteURL = nodeRedConfig.webSocketURL + '/ws/iot';
  console.log('creating nodeRemote connection', nodeRemoteURL);
  var nodeRemote = new WebSocket(nodeRemoteURL);
  nodeRemote.on('open', function () {
    console.log('nodeRemote open', '/ws/iot');
  })
  nodeRemote.on('close', function (code, reason) {
    console.log('nodeRemote closed', '/ws/iot', code, reason);
    ws.close();
  });
  nodeRemote.on('message', function (data) {
    console.log('message from nodeRemote', data);
    try {
      ws.send(data);
    } catch(err) {
      console.log('You need to refresh your connection');
    }
  });
  nodeRemote.on('error', function (data) {
    console.log('AN ERROR OCCURED: ', data);
    ws.close();
  });
});

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '4200';
app.set('port', port);


/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));