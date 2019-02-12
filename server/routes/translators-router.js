let express = require('express')
let controller = require('./../controllers/translators-controller')
let middlewares = require('./../middlewares')

let router = express.Router()

router.use(middlewares.auth.isInRole('user'))

router.post('/:translatorId/pay-honorary', controller.payHonorary)
router.get('/not-paid-honorary', controller.notPaidHonorary)
router.get('/:id?', controller.list)
router.put('/:id?', controller.update)
router.post('/', controller.create)
router.delete('/:id', controller.delete)

module.exports = router
