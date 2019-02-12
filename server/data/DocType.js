let mongoose = require('mongoose')

let docTypeSchema = new mongoose.Schema({
  name: String,
  isDeleted: { type: Boolean, default: false }
})

mongoose.model('DocType', docTypeSchema)
