let express = require('express')
let controller = require('./../controllers/users-controller')
let middlewares = require('./../middlewares')

let router = express.Router()

router.get('/sidebar-menu', middlewares.auth.isInRole('user'), controller.sidebar)
router.get('/:id?', middlewares.auth.isInRole('admin'), controller.list)
router.put('/:id?', middlewares.auth.isInRole('admin'), controller.update)
router.post('/', middlewares.auth.isInRole('admin'), controller.create)
router.delete('/:id', middlewares.auth.isInRole('admin'), controller.delete)

module.exports = router
