let express = require('express')
let controller = require('./../controllers/orders-controller')
let middlewares = require('./../middlewares')

let router = express.Router()

router.use(middlewares.auth.isInRole('user'))

router.post('/:id/archive', middlewares.auth.isInRole('user'), controller.archive)
router.post('/:id/unarchive', middlewares.auth.isInRole('user'), controller.unarchive)
router.post('/:customer/payall', middlewares.auth.isInRole('user'), controller.payAll)
router.post('/:id/new-item', middlewares.auth.isInRole('user'), controller.addNewItem)
router.post('/', controller.create)

router.get('/archive', controller.listArchive)
router.get('/statuses', controller.listStatuses)
router.get('/is-paid-list', controller.isPaidList)
router.get('/not-paid-by-customer', middlewares.auth.isInRole('user'), controller.notPaidOrdersGroupedByCustomer)
router.get('/not-paid-honorary/:translatorId', controller.notPaidHonoraryOrdersByTranslator)
router.get('/aggregateOrdersPerCustomer', middlewares.auth.isInRole('admin'), controller.aggregateOrdersPerCustomer)
router.get('/:id?', controller.list)
router.put('/:id', controller.update)
router.delete('/:id', controller.delete)

module.exports = router
