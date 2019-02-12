let mongoose = require('mongoose')

let documentSchema = new mongoose.Schema({
  date: Date,
  submissionDate: Date,
  returnDate: Date,
  titular: String,
  ministry: String,
  currier: String,
  description: String,
  isDeleted: { type: Boolean, default: false }
})

mongoose.model('Document', documentSchema)
