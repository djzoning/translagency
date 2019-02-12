let Customer = require('mongoose').model('Customer')
let Translator = require('mongoose').model('Translator')

let enums = {
  customers: {},
  translators: {}
}

enums.load = () => {
  Customer.find().then(customers => {
    for (let i in customers) {
      enums.customers[customers[i]._id] = customers[i]
    }
  })

  Translator.find().then(translators => {
    for (let i in translators) {
      enums.translators[translators[i]._id] = translators[i]
      enums.translators[translators[i]._id].name = translators[i].firstName + ' ' + translators[i].lastName
    }
  })
}

module.exports = enums
