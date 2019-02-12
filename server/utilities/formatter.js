let _ = require('lodash')

module.exports = {
  dataTables: {
    formatDocs: docs => {
      let result = { data: [] }

      for (let doc of docs) {
        let item = []
        item.push(doc.name)
        item.push(`<button onclick="deleteDocType('${doc._id}')" class="btn btn-danger"><i class="fa fa-remove"></i></button>`)

        result.data.push(item)
      }

      return result
    },
    profitByCustomer: customers => {
      let result = { data: [] }

      for (let customer of customers) {
        let item = []
        if (customer._id.length === 0) {
          continue
        }

        item.push(customer._id[0].name ? customer._id[0].name : customer._id)
        item.push(customer.profit)

        result.data.push(item)
      }

      return result
    },
    orders: (orders, type, isAdmin, isArchive) => {
      let result = { data: [] }
      let order = []

      if (type === 'notPaid') {
        for (let i = 0; i < orders.length; i++) {
          order = []

          order.push(orders[i].orderNumber)
          order.push(formatDate(orders[i].startDate))
          let customer = orders[i].customer ? orders[i].customer.name : orders[i].customerName
          order.push(customer)
          order.push(orders[i].sender)
          order.push(orders[i].titular)
          order.push(orders[i].orderEntries[0].docType ? orders[i].orderEntries[0].docType.name : '')
          order.push(orders[i].orderEntries[0].translateFrom ? orders[i].orderEntries[0].translateFrom.name : '')
          order.push(orders[i].orderEntries[0].translateTo ? orders[i].orderEntries[0].translateTo.name : '')
          order.push(orders[i].orderEntries[0].pagesCount)
          order.push(orders[i].orderEntries[0].pricePerPage)
          order.push(((orders[i].orderEntries[0].stateTax * 100) + (orders[i].orderEntries[0].companyTax * 100)) / 100)
          order.push(orders[i].price)

          result.data.push(order)
        }
      } else {
        for (let i = 0; i < orders.length; i++) {
          order = []
          order.push(`<div data-id="${orders[i]._id}">${orders[i].orderNumber}</div>`)
          order.push(formatDate(orders[i].startDate))
          order.push(orders[i].customer ? orders[i].customer.name : orders[i].customerName)
          order.push(orders[i].titular)
          order.push(orders[i].orderEntries[0].docType)
          order.push(orders[i].invoiceNumber)

          let isDone = orders[i].isDone ? `<span class="done dropdown" data-field="isDone" data-source="/api/orders/statuses" data-id="${orders[i]._id}">Готова</span>` : `<span class="not-done dropdown" data-field="isDone" data-source="/api/orders/statuses" data-id="${orders[i]._id}">Не е готова</span>`
          order.push(isDone)

          let isPaid = orders[i].isPaid ? '<span class="done">Платена</span>' : '<span class="not-done">Неплатена</span>'

          if (isAdmin) {
            isPaid = orders[i].isPaid ? `<span class="done dropdown" data-field="isPaid" data-source="/api/orders/is-paid-list" data-id="${orders[i]._id}">Платена</span>` : `<span class="not-done dropdown" data-field="isPaid" data-source="/api/orders/is-paid-list" data-id="${orders[i]._id}">Неплатена</span>`
          }
          
          order.push(isPaid)
          order.push(orders[i].price)
          order.push(orders[i].createdBy.firstName)
          let action = isArchive ? 'Р' : 'А'
          order.push(`<button class="btn btn-primary btn-custom" data-archive-id="${orders[i]._id}">${action}</button>`)

          result.data.push(order)
        }
      }

      return result
    },
    languages: input => {
      let result = { data: [] }

      for (let i = 0; i < input.length; i++) {
        let language = []
        language.push(input[i].name)
        language.push(`<div class="cursor-pointer" data-language="${input[i].name}">${input[i].price ? input[i].price : 0}</div>`)
        result.data.push(language)
      }

      return result
    },
    customers: input => {
      let result = { data: [] }

      for (let i = 0; i < input.length; i++) {
        let customer = []
        customer.push(`<div data-id="${input[i]._id}">${input[i].name}</div>`)
        customer.push(input[i].address)
        customer.push(input[i].phone)
        customer.push(input[i].contactPerson)

        result.data.push(customer)
      }

      return result
    },
    translators: input => {
      let result = { data: [] }

      for (let i = 0; i < input.length; i++) {
        let translator = []
        let name = input[i].firstName + ' ' + input[i].lastName
        translator.push(name)

        translator.push(`<div class="cursor-pointer" data-type="text" data-name="phone" data-id="${input[i]._id}">${input[i].phone}</div>`)
        translator.push(`<div class="cursor-pointer" data-type="text" data-name="secondPhone" data-id="${input[i]._id}">${input[i].secondPhone}</div>`)
        translator.push(`<div class="cursor-pointer" data-type="text" data-name="email" data-id="${input[i]._id}">${input[i].email}</div>`)
        translator.push(`<div class="cursor-pointer" data-type="text" data-name="secondEmail" data-id="${input[i]._id}">${input[i].secondEmail}</div>`)
        
        let languages = []
        _.map(input[i].languages, lang => {
          languages.push(lang.name)
        })
        translator.push(languages ? languages.toString() : '')
        let honorary = input[i].honorary ? input[i].honorary : ''
        translator.push(`<div class="cursor-pointer" data-type="number" data-name="honorary" data-id="${input[i]._id}">${honorary}</div>`)
        translator.push(`<button class="btn-delete-translator btn btn-danger" onclick="confirm(this)" data-id="${input[i]._id}"><i class="fa fa-remove"></i></div>`)
        result.data.push(translator)
      }

      return result
    },
    notPaidHonorary: translators => {
      let result = { data: [] }

      for (let translator of translators) {
        let row = []
        let notPaidHonorary = 0
        _.map(translator.notPaidOrders, notPaidOrder => {
          notPaidHonorary += notPaidOrder.notPaidAmount
        })
        row.push(`<div class="cursor-pointer" data-id="${translator._id}">${translator.firstName} ${translator.lastName}</div>`)
        row.push(notPaidHonorary)
        result.data.push(row)
      }

      return result
    },
    notPaidHonoraryOrdersByTranslator: (orders, notPaidTranslator) => {
      let result = { data: [] }

      for (let order of orders) {
        let row = []
        row.push(`<div data-id="${order._id}">${order.orderNumber}</div>`)
        let customer = order.customer ? order.customer.name : order.customerName
        row.push(customer)
        row.push(formatDate(order.startDate))
        row.push(`${notPaidTranslator[order._id]} лв.`)
        // row.push(`${order.price} лв.`)
        let isDone = order.isDone ? '<span class="done">Готова</span>' : '<span class="not-done">Не е готова</span>'
        row.push(isDone)

        let isPaid = order.isPaid ? '<span class="done">Платена</span>' : '<span class="not-done">Неплатена</span>'
        row.push(isPaid)
        row.push(order.createdBy.firstName)
        result.data.push(row)
      }

      return result
    },
    users: users => {
      let result = { data: [] }
      let user = []

      for (let i = 0; i < users.length; i++) {
        user = []

        user.push(`<div data-id="${users[i]._id}">${users[i].firstName} ${users[i].lastName}</div>`)
        user.push(`<div>${users[i].username}</div>`)
        user.push(`<button onclick="deleteUser('${users[i]._id}')" class="btn btn-danger">Изтрий</button>`)

        result.data.push(user)
      }

      return result
    },
    ministries: ministries => {
      let result = { data: [] }
      let ministry = []

      for (let mnstry of ministries) {
        ministry = []
        ministry.push(mnstry.name)
        ministry.push(`<button onclick="deleteMinistry('${mnstry._id}')" class="btn btn-danger"><i class="fa fa-remove"></i></button>`)

        result.data.push(ministry)
      }

      return result
    },
    documents: documents => {
      let result = { data: [] }
      let row = []

      for (let document of documents) {
        row = []

        row.push(formatDate(document.date))
        row.push(`<div class="cursor-pointer" data-type="text" data-name="titular" data-id="${document._id}">${document.titular}</div>`)
        row.push(`<div class="cursor-pointer" data-type="select" data-source="/api/ministries?format=xedit" data-name="ministry" data-id="${document._id}">${document.ministry}</div>`)
        row.push(`<div class="border-bottom-dashed date-editable">${formatDate(document.submissionDate)}</div><input type="text" class="hidden date-control date-picker date-picker-custom form-control" data-field="submissionDate" data-document-id="${document._id}">`)
        row.push(`<div class="cursor-pointer" data-type="text" data-name="currier" data-id="${document._id}">${document.currier}</div>`)
        row.push(`<div class="border-bottom-dashed date-editable">${formatDate(document.returnDate)}</div><input type="text" class="hidden date-control date-picker date-picker-custom form-control" data-field="returnDate" data-document-id="${document._id}">`)
        row.push(`<div class="cursor-pointer" data-type="text" data-name="description" data-id="${document._id}">${document.description}</div>`)
        row.push(`<button onclick="deleteDocument('${document._id}')" class="btn btn-danger"><i class="fa fa-remove"></i></button>`)

        result.data.push(row)
      }

      return result
    },
    notPaidByCustomer: data => {
      let result = { data: [] }
      let row = []

      for (let item of data) {
        if (!item._id.length) continue

        row = []
        let customer = Array.isArray(item._id) ? item._id[0].name : item._id
        let customerId = Array.isArray(item._id) ? item._id[0]._id : 0
        row.push(`<div data-id="${customerId}">${customer}</div>`)
        row.push(item.price)

        result.data.push(row)
      }

      return result
    }
  },
  select2: {
    formatDocs: docs => {
      let result = { results: [] }
      let docType
      for (let doc of docs) {
        docType = {
          id: doc.name,
          text: doc.name
        }
        result.results.push(docType)
      }

      return result
    },
    languages: languages => {
      let data = { results: [] }
      let language
      for (let i in languages) {
        language = {
          id: languages[i]._id,
          text: languages[i].name
        }
        data.results.push(language)
      }

      return data
    },
    senders: senders => {
      let data = { results: [] }
      for (let sender of senders) {
        let item = {
          id: sender,
          text: sender
        }
        data.results.push(item)
      }

      return data
    },
    customers: customers => {
      let data = { results: [] }
      let customer
      for (let i in customers) {
        customer = {
          id: customers[i]._id,
          text: customers[i].name
        }
        data.results.push(customer)
      }

      return data
    },
    translators: translators => {
      let data = { results: [] }
      let translator
      for (let i in translators) {
        translator = {
          id: translators[i]._id,
          text: translators[i].name
        }
        data.results.push(translator)
      }

      return data
    },
    ministries: ministries => {
      let data = { results: [] }
      let ministry
      for (let mnstry of ministries) {
        ministry = {
          id: mnstry.name,
          text: mnstry.name
        }
        data.results.push(ministry)
      }

      return data
    }
  },
  xedit: {
    languages: input => {
      let result = []
      for (let item of input) {
        result.push({
          value: item._id,
          text: item.name
        })
      }

      return result
    },
    translators: translators => {
      let result = []
      for (let translator of translators) {
        result.push({
          value: translator._id,
          text: translator.firstName + ' ' + translator.lastName
        })
      }

      return result
    },
    ministries: input => {
      let result = []
      for (let item of input) {
        result.push({
          value: item.name,
          text: item.name
        })
      }

      return result
    },
    senders: input => {
      let result = []
      for (let item of input) {
        result.push({
          value: item,
          text: item
        })
      }

      return result
    }
  }
}

let formatDate = (date) => {
  if (!date) {
    return 'N/A'
  }

  let months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

  let year = date.getFullYear().toString().substring(2, 4)
  let month = months[date.getMonth()]
  month = month.toString().length === 1 ? '0' + month : month
  let day = date.getDate()
  day = day.toString().length === 1 ? '0' + day : day
  let formatedDate = day + '.' + month + '.' + year

  return formatedDate
}
