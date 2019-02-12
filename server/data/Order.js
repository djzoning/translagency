let mongoose = require('mongoose')
let mongoosePaginate = require('mongoose-paginate')

let orderSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  price: Number,
  profit: Number,
  stateTax: Number,
  companyTax: Number,
  titular: { type: String, default: null },
  sender: { type: String, default: null },
  orderEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderEntry' }],
  orderNumber: Number,
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, default: null },
  invoiceNumber: { type: String, default: null },
  isPaid: { type: Boolean, default: false },
  isDone: { type: Boolean, default: false },
  description: { type: String },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isArchived: { type: Boolean, default: false}
})

orderSchema.plugin(mongoosePaginate)

mongoose.model('Order', orderSchema)
