let _ = require('lodash')

let formatDate = (date) => {
  if (!date) {
    return 'N/A'
  }

  let months = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември']

  let year = date.getFullYear()
  let month = months[date.getMonth()]
  month = month.toString().length === 1 ? '0' + month : month
  let day = date.getDate()
  day = day.toString().length === 1 ? '0' + day : day
  let formatedDate = day + ' ' + month + ' ' + year

  return formatedDate
}

module.exports = {
  xedit: (input, field) => {
    let result = []
    if (field) {
      for (let item of input) {
        result.push({
          value: item._id,
          text: item[field]
        })
      }
    } else {
      for (let item of input) {
        result.push({
          value: item._id,
          text: item.firstName + ' ' + item.lastName
        })
      }
    }

    return result
  },
  convertOrders: (input) => {
    let result = { data: [] }
    let order = []

    for (let i = 0; i < input.length; i++) {
      order = []

      order.push(`<div data-id="${input[i]._id}">${input[i].orderNumber}</div>`)
      order.push(formatDate(input[i].startDate))
      order.push(formatDate(input[i].endDate))
      order.push(input[i].customer ? input[i].customer.name : '')

      result.data.push(order)
    }

    return result
  },

  convertAggregatedOrders: (input) => {
    let result = { data: [] }
    let customer = []

    for (let i = 0; i < input.length; i++) {
      customer = []

    
      customer.push(input[i]._id)
      customer.push(input[i].count)

      result.data.push(customer)
    }

    return result
  }
}
