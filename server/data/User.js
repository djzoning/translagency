let mongoose = require('mongoose')
let encryption = require('../utilities/encryption')

let userSchema = new mongoose.Schema({
  username: { type: String, require: true, unique: true },
  hashedPassword: { type: String, require: true },
  salt: { type: String, required: true },
  firstName: { type: String, require: true },
  lastName: { type: String, require: true },
  roles: [String],
  isDeleted: { type: Boolean, default: false }
})

userSchema.method({
  authenticate: function (password) {
    if (encryption.generateHashedPassword(this.salt, password) === this.hashedPassword) {
      return true
    } else {
      return false
    }
  }
})

let User = mongoose.model('User', userSchema)

module.exports.seedAdminUser = () => {
  User.find({})
    .then((users) => {
      if (users.length > 0) return

      let password = process.env.ADMIN_PASSWORD || '123'
      let salt = encryption.generateSalt()
      let hashedPassword = encryption.generateHashedPassword(salt, password)

      User.create({
        username: 'admin',
        firstName: 'Admin',
        lastName: 'Adminov',
        salt: salt,
        hashedPassword: hashedPassword,
        roles: ['superadmin', 'admin', 'user']
      })
    })
    .catch(err => console.log(err))
}
