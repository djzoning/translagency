let homeController = require('./home-controller')
let usersController = require('./users-controller')
let customersController = require('./customers-controller')
let translatorsController = require('./translators-controller')
let languagesController = require('./languages-controller')
let ordersController = require('./orders-controller')
let insightsController = require('./insights-controller')
let docTypesController = require('./doc-types-controller')
let ministriesController = require('./ministries-controller')
let documentsController = require('./documents-controller')

module.exports = {
  home: homeController,
  users: usersController,
  customers: customersController,
  translators: translatorsController,
  languages: languagesController,
  orders: ordersController,
  insights: insightsController,
  docTypes: docTypesController,
  ministries: ministriesController,
  documents: documentsController
}
