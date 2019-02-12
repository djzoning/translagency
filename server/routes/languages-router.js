let express = require('express')
let middlewares = require('./../middlewares')
let controller = require('./../controllers/languages-controller')

let router = express.Router()

router.get('/', middlewares.auth.isInRole('user'), controller.list)
router.get('/get-price', middlewares.auth.isInRole('user'), controller.getPrice)
router.post('/', middlewares.auth.isInRole('admin'), controller.create)
router.post('/update-price', middlewares.auth.isInRole('admin'), controller.update)

module.exports = router
