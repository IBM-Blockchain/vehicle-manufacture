var request = require('request')
var config = require('config');

var composerBaseURL = process.env.COMPOSER_BASE_URL || config.get('composerRestServerBaseURL');
var endpoint = composerBaseURL + '/api/Vehicle/'

var get = (req, res) => {
  var vin = req.baseUrl.split('/');
  vin = vin[vin.length - 1];
  console.log('What is endpoint',endpoint+vin);
  request.get({
    url: endpoint+vin,
    json: true
  }, (err, response, body) => {
    res.send(body)
  })
}

module.exports = {
  get: get
}
