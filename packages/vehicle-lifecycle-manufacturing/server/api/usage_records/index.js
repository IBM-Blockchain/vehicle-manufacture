var express = require('express')
var controller = require('./usage_records')

var router = express.Router()

router.get('/', controller.get)

module.exports = router
