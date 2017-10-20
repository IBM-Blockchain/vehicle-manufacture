module.exports = function (app) {
  'use strict'

  app.use('/transactions', require('./api/transactions'))
  app.use('/vehicles', require('./api/vehicles'))
  app.use('/vehicles/:vin', require('./api/vehicle_specific'))
  app.use('/vehicles_query', require('./api/vehicles_query'))
  app.use('/usage_records', require('./api/usage_records'))
}
