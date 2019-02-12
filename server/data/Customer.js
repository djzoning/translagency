let mongoose = require('mongoose')
let mongoosePaginate = require('mongoose-paginate')

let customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  senders: [String],
  nsn: {
    type: String
  },
  address: String,
  email: {
    type: String//,
    // match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  },
  phone: {
    type: String
  },
  contactPerson: String,
  description: String,
  isDeleted: { type: Boolean, default: false }
})

customerSchema.plugin(mongoosePaginate)

mongoose.model('Customer', customerSchema)
