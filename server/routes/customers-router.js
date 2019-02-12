let express = require('express')
let controller = require('./../controllers/customers-controller')
let middlewares = require('./../middlewares')

let router = express.Router()

router.use(middlewares.auth.isInRole('user'))

router.get('/:id?/senders', controller.senders)
router.post('/:id/senders', controller.updateSenders)
router.get('/:id?', controller.list)
router.put('/:id', controller.update)
router.post('/', controller.create)
router.delete('/:id', controller.delete)

module.exports = router
