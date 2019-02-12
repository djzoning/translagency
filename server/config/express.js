let express = require('express')
let path = require('path')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let passport = require('passport')
let session = require('express-session')
let fs = require('fs')

module.exports = (app, config) => {
  app.set('view engine', 'ejs')
  app.set('views', path.join(config.rootPath, '/server/views'))

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(cookieParser())
  app.use(session({
    secret: 'session-secret',
    resave: true,
    saveUninitialized: true
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(express.static('public'))
  app.use('/gentelella', express.static(path.join(config.rootPath, '/node_modules/gentelella')))
  app.use('/node_modules', express.static(path.join(config.rootPath, '/node_modules')))
  app.use((req, res, next) => {
    let date = new Date()
    let logLine = date.toString().split(' ').slice(0, 3).join(' ')
    logLine += ` ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}: [${req.connection.remoteAddress}] >>> ${req.user ? req.user.username : 'No User'} >>> ${req.method} -> ${req.path}`
    console.log(logLine)
    logLine += '\n'
    if (Object.keys(req.body).length) {
      console.log(req.body)
      logLine += `${JSON.stringify(req.body, null, 2)}\n`
    }

    fs.appendFile('log.txt', logLine, () => {})

    next()
  })
  app.use((req, res, next) => {
    app.locals.currentYear = new Date().getFullYear()
    next()
  })

  // Prevents the back browser's button from showing secure data after user logs out
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')
    next()
  })

  console.log('Express ready!')
}
