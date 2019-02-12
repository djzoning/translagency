let mongoose = require('mongoose')

let orderEntrySchema = new mongoose.Schema({
  docType: { type: String },
  translator: { type: mongoose.Schema.Types.ObjectId, ref: 'Translator' },
  oneTimeTranslator: { type: String, default: null },
  translateFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  translateTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  pagesCount: Number,
  pricePerPage: Number,
  honoraryPerPage: Number
})

mongoose.model('OrderEntry', orderEntrySchema)
