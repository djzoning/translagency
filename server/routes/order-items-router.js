let express = require('express')
let middlewares = require('./../middlewares')
let controller = require('./../controllers/order-items-controller')

let router = express.Router()

router.put('/update-translator/:id', middlewares.auth.isInRole('user'), controller.updateTranslator)
router.put('/:id', middlewares.auth.isInRole('user'), controller.update)

module.exports = router
