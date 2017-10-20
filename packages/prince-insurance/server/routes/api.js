const express = require('express');
const router = express.Router();
const request = require('request');

router.get('/vehicles', (req, res) => {
  var endpoint = 'http://localhost:6001/vehicles'

  request.get({
    url: endpoint,
    json: true
  }, (err, response, body) => {
    res.send({
      results: body
    })
  })
});

module.exports = router;