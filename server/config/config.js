let path = require('path')

let rootPath = path.normalize(path.join(__dirname, '/../../'))

module.exports = {
  development: {
    rootPath: rootPath,
    db: 'mongodb://localhost:27017/translagency',
    port: 9005,
    mailHour: 18,
    mailServerUser: '',
    mailServerPass: '',
    mailReceiver: ''
  },
  production: {
    rootPath: rootPath,
    db: process.env.MONGO_DB_CONNECTION_STRING,
    port: process.env.PORT,
    mailHour: 18,
    mailServerUser: process.env.MAIL_SERVER_USER,
    mailServerPass: process.env.MAIL_SERVER_PASS,
    mailReceiver: process.env.MAIL_RECEIVER
  }
}
