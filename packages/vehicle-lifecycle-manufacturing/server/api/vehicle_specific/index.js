var express = require('express')
var controller = require('./vehicle_specific')

var router = express.Router()

router.get('/', controller.get)

module.exports = router
