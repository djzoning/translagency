let mongoose = require('mongoose')

let languageSchema = new mongoose.Schema({
  name: String,
  price: Number
})

mongoose.model('Language', languageSchema)
