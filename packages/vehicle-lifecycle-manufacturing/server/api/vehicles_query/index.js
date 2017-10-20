var express = require('express')
var controller = require('./vehicles_query')

var router = express.Router()

router.get('/', controller.get)

module.exports = router
