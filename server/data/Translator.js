let mongoose = require('mongoose')

let translatorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  languages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language' }],
  honorary: { type: Number },
  notPaidOrders: [{ orderId: String, notPaidAmount: Number }],
  email: String,
  secondEmail: String,
  phone: String,
  secondPhone: String,
  isDeleted: { type: Boolean, default: false }
})

translatorSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`
})

mongoose.model('Translator', translatorSchema)
