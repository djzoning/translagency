let mongoose = require('mongoose')

let ministrySchema = new mongoose.Schema({
  name: String,
  isDeleted: { type: Boolean, default: false }
})

mongoose.model('Ministry', ministrySchema)
