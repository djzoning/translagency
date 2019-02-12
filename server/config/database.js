let mongoose = require('mongoose')

mongoose.Promise = global.Promise

module.exports = (config) => {
  mongoose.connect(config.db)

  let db = mongoose.connection
  db.once('open', (err) => {
    if (err) console.log(err)

    console.log('MongoDB ready!')
  })

  db.on('error', (err) => console.log('Database error: ' + err))

  require('../data/User').seedAdminUser()
  require('../data/Customer')
  require('../data/Translator')
  require('../data/Language')
  require('../data/Order')
  require('../data/OrderEntry')
  require('../data/DocType')
  require('../data/Ministry')
  require('../data/Document')

  require('../utilities/enums').load()
}
