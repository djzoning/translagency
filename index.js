let express = require('express')
let app = express()
let environment = process.env.NODE_ENV || 'development'
let config = require('./server/config/config')[environment]

require('./server/config/database')(config)
require('./server/config/express')(app, config)
require('./server/config/routes')(app)
require('./server/config/passport')()
require('./server/config/mail')(config)

app.listen(config.port, () => {
  console.log(`Server is running on port: ${config.port}`)
})
