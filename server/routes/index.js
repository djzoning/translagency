let ordersRouter = require('./orders-router')
let languagesRouter = require('./languages-router')
let translatorsRouter = require('./translators-router')
let customersRouter = require('./customers-router')
let usersRouter = require('./users-router')
let docTypesRouter = require('./doc-types-router')
let orderItemsRouter = require('./order-items-router')
let ministriesRouter = require('./ministries-router')
let documentsRouter = require('./documents-router')

module.exports = {
  orders: ordersRouter,
  languages: languagesRouter,
  translators: translatorsRouter,
  customers: customersRouter,
  users: usersRouter,
  docTypes: docTypesRouter,
  orderItems: orderItemsRouter,
  ministries: ministriesRouter,
  documents: documentsRouter
}
