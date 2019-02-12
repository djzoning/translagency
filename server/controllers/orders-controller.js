let Order = require('mongoose').model('Order')
let OrderEntry = require('mongoose').model('OrderEntry')
let Customer = require('mongoose').model('Customer')
let Language = require('mongoose').model('Language')
let Translator = require('mongoose').model('Translator')
let ObjectId = require('mongoose').Types.ObjectId
let dataTablesConverter = require('./../utilities/datatable-converter')
let formatter = require('./../utilities/formatter')
let pdf = require('html-pdf')
let fs = require('fs')
let _ = require('lodash')

let getOrderNumber = () => {
  return new Promise((resolve, reject) => {
    Order
      .find()
      .sort({ orderNumber: -1 })
      .then(orders => {
        if (orders.length > 0) {
          resolve(orders[0].orderNumber)
        } else {
          resolve(1)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}

module.exports = {
  index: (req, res) => {
    res.render('orders/list', { user: req.user })
  },
  notPaid: (req, res) => {
    res.render('orders/not-paid', { user: req.user })
  },
  notPaidByCustomerView: (req, res) => {
    res.render('orders/not-paid-by-customer', { customerId: req.params.id, user: req.user })
  },
  details: (req, res) => {
    res.render('orders/details', { user: req.user, orderId: req.params.id })
  },
  archiveView: (req, res) => {
    res.render('orders/archive', { user: req.user })
  },
  listArchive: (req, res) => {
    return Order.find({isDeleted: false, isArchived: true})
      .populate('customer')
      .populate({
        path: 'orderEntries',
        model: 'OrderEntry',
        populate: [{
          path: 'translator',
          model: 'Translator'
        },
        {
          path: 'translateFrom',
          model: 'Language'
        },
        {
          path: 'translateTo',
          model: 'Language'
        }]
      })
      .populate('createdBy', 'firstName lastName')
      .then(orders => {
        let isAdmin = req.user.roles.indexOf('admin') !== -1
        let data = formatter.dataTables.orders(orders, 'normal', isAdmin, true)

        return res.json(data)
      })
  },
  addNewItem: (req, res) => {
    let item = req.body
    let notPaidHonoraries = {}
    return OrderEntry.create(item)
    .then(newEntry => {
      notPaidHonoraries[req.body.translator] = newEntry.pagesCount * 1000 * newEntry.honoraryPerPage / 1000

      return Order.update({
        _id: req.params.id
      }, {
        '$push': {
          orderEntries: newEntry._id
        },
        '$inc': {
          price: newEntry.pagesCount * 1000 * newEntry.pricePerPage / 1000,
          profit: (newEntry.pagesCount * 1000 * newEntry.pricePerPage - newEntry.pagesCount * 1000 * newEntry.honoraryPerPage) / 1000
        }
      })
      .then(result => {
        return updateTranslatorHonorary(notPaidHonoraries, req.params.id)
      })
      .then(() => {
        return res.redirect(`/order/${req.params.id}`)
      })
    })
    .catch(er => {
      console.log(er)
      
      return res.status(500).send('error')
    })
  },
  create: (req, res) => {
    let order = req.body
    let currentDate = new Date()
    let isoString = currentDate.toISOString()
    let date = new Date(isoString.split('T')[0])
    let endDateAsArray = order.endDate.split('-')
    let endDate = new Date(`${endDateAsArray[2]}-${endDateAsArray[1]}-${endDateAsArray[0]}`)
    if (!order.endDate) {
      endDate = null
    }

    let newOrder = {
      customer: order.customer,
      sender: order.sender,
      titular: order.titular ? order.titular : null,
      endDate: endDate,
      description: order.description,
      stateTax: order.stateTax,
      companyTax: order.companyTax,
      startDate: date,
      invoiceNumber: order.invoiceNumber,
      createdBy: req.user._id
    }

    let notPaidHonoraries = {}

    return new Promise((resolve, reject) => {
      if (ObjectId.isValid(order.customer)) {
        return Customer.findById(order.customer)
        .then(customer => {
          if (customer !== null) {
            newOrder.customer = order.customer
          } else {
            newOrder.customer = null
            newOrder.customerName = order.customer
          }
          
          if ((customer !== null && customer.senders.indexOf(newOrder.sender) !== -1) || !newOrder.sender) {
            return resolve()
          }

          let newSenders = customer.senders
          newSenders.push(newOrder.sender)
          return Customer.update({ _id: order.customer }, { senders: newSenders })
            .then(result => {

              resolve()
            })
            .catch(er => {
              console.log(er)

              reject()
            })
        })
      } else {
        newOrder.customer = null
        newOrder.customerName = req.body.customer

        resolve()
      }
    })
    .then(lang => {
      if (Array.isArray(order.docType)) {
        // MULTIPLE DOCUMENTS
        let orderEntriesIds = []
        let price = 0
        let profit = 0
        return new Promise((resolve, reject) => {
          for (let i = 0; i < order.docType.length; i++) {
            price += order.pricePerPage[i] * 1000 * order.pagesCount[i] / 1000
            profit += ((order.pricePerPage[i] * 1000 * order.pagesCount[i]) - (order.honoraryPerPage[i] * 1000 * order.pagesCount[i])) / 1000
            let translator = order.translator[i]
            let oneTimeTranslator = null
            if (!ObjectId.isValid(order.translator[i])) {
              translator = null
              oneTimeTranslator = order.translator[i]
            }

            let newEntry = {
              docType: order.docType[i],
              translator: translator,
              oneTimeTranslator: oneTimeTranslator,
              translateFrom: order.translateFrom[i],
              translateTo: order.translateTo[i],
              pagesCount: order.pagesCount[i],
              pricePerPage: order.pricePerPage[i],
              honoraryPerPage: order.honoraryPerPage[i]
            }
            OrderEntry
            .create(newEntry)
            .then(entry => {
              orderEntriesIds.push(entry._id)
              notPaidHonoraries[entry.translator] =
                notPaidHonoraries[entry.translator] !== undefined
                ? (notPaidHonoraries[entry.translator] * 1000 + entry.pagesCount * 1000 * entry.honoraryPerPage) / 1000
                : entry.pagesCount * 1000 * entry.honoraryPerPage / 1000
              if (orderEntriesIds.length === order.docType.length) {
                profit = order.companyTax ? (profit * 1000 + parseFloat(order.companyTax) * 1000) / 1000 : profit
                let ct = order.companyTax ? parseFloat(order.companyTax) : 0
                let st = order.stateTax ? parseFloat(order.stateTax) : 0
                price = (price * 1000 + ct * 1000 + st * 1000) / 1000

                newOrder.orderEntries = orderEntriesIds
                newOrder.price = price
                newOrder.profit = profit

                resolve()
              }
            })
          }
        })
        .then(() => {
          return getOrderNumber()
        })
        .then(orderNumber => {
          newOrder.orderNumber = orderNumber + 1
        })
        .then(() => {
          return Order.create(newOrder)
        })
        .then(result => {
          return updateTranslatorHonorary(notPaidHonoraries, result._id)
        })
        .then(order => {
          res.redirect('/orders')

          return
        })
      } else {
        // SINGLE DOCUMENT
        let order = req.body
        let translator = order.translator
        let oneTimeTranslator = null
        if (!ObjectId.isValid(translator)) {
          translator = null
          oneTimeTranslator = order.translator
        }

        let orderEntry = {
          docType: order.docType,
          translator: translator,
          oneTimeTranslator: oneTimeTranslator,
          translateFrom: order.translateFrom,
          translateTo: order.translateTo,
          pagesCount: order.pagesCount,
          pricePerPage: order.pricePerPage,
          honoraryPerPage: order.honoraryPerPage
        }
        return OrderEntry.create(orderEntry)
        .then(entry => {
          let price = entry.pricePerPage * 1000 * entry.pagesCount / 1000
          let profit = ((entry.pricePerPage * 1000 * entry.pagesCount) - (entry.honoraryPerPage * 1000 * entry.pagesCount)) / 1000
          profit = order.companyTax ? (profit * 1000 + parseFloat(order.companyTax) * 1000) / 1000 : profit
          let st = order.stateTax ? parseFloat(order.stateTax) : 0
          let ct = order.companyTax ? parseFloat(order.companyTax) : 0
          price = (price * 1000 + st * 1000 + ct * 1000) / 1000
          newOrder.orderEntries = [entry]
          newOrder.price = price
          newOrder.profit = profit
          notPaidHonoraries[entry.translator] = entry.pagesCount * 1000 * entry.honoraryPerPage / 1000
        })
        .then(() => {
          return getOrderNumber()
        })
        .then(orderNumber => {
          newOrder.orderNumber = orderNumber + 1

          return Order.create(newOrder)
        })
        .then(result => {
          return updateTranslatorHonorary(notPaidHonoraries, result._id)
        })
        .then(() => {
          res.redirect('/orders')
        })
        .catch(er => {
          console.log(er)
        })
      }
    })
  },
  list: (req, res) => {
    let query = { isDeleted: false, $or: [{isArchived: false}, {isArchived: null}] }
    if (req.params.id) {
      query._id = req.params.id
      delete query.$or
    }

    if (req.query.hasOwnProperty('page')) {
      let page = req.query.page
      let limit = 10

      if (req.query.hasOwnProperty('limit')) {
        limit = parseInt(req.query.limit)
      }

      Order
        .paginate(query, { page: page, limit: limit })
        .then(orders => {
          let data = transformOrdersJson(req.query.format, orders)
          res.json(data)
        })
        .catch(error => {
          console.log(error)
          res.json(error)
        })
    } else {
      if (req.query.fromDate && req.query.toDate) {
        query.startDate = {
          $gte: new Date(req.query.fromDate),
          $lte: new Date(req.query.toDate)
        }
      }

      if (req.query.customer && req.query.isPaid) {
        query.customer = req.query.customer
        query.isPaid = req.query.isPaid
      }

      Order
        .find(query)
        .populate('customer')
        .populate({
          path: 'orderEntries',
          model: 'OrderEntry',
          populate: [{
            path: 'translator',
            model: 'Translator'
          },
          {
            path: 'translateFrom',
            model: 'Language'
          },
          {
            path: 'translateTo',
            model: 'Language'
          }]
        })
        .populate('createdBy', 'firstName lastName')
        .then(orders => {
          let roles = req.user ? req.user.roles : []
          let data = orders
          let type = ''
          if (req.query.format) {
            if (req.query.type) {
              type = req.query.type
            }

            let isAdmin = req.user.roles.indexOf('admin') !== -1
            data = formatter[req.query.format].orders(orders, type, isAdmin, false)
          }

          if (req.params.id) {
            data[0].price = Math.round(data[0].price * 100) / 100
            data[0].profit = Math.round(data[0].profit * 100) / 100
            if (req.params.id && roles.indexOf('admin') === -1) {
              data[0].profit = null
            }
          }

          res.json(data)
        })
        .catch(error => {
          console.log(error)
          res.json(error)
        })
    }
  },
  update: (req, res) => {
    let query = { _id: req.params.id }
    let update = req.body
    let updatePriceAndProfit = false

    if (req.body.isPaid && req.user.roles.indexOf('admin') === -1) {
      return res.status(403).end()
    }

    if (req.query.xedit) {
      update = {}
      update[req.body.name] = req.body.value

      if (req.body.name === 'stateTax' || req.body.name === 'companyTax') {
        updatePriceAndProfit = true
      }
    }

    if (req.query.xedit && req.body.name === 'endDate') {
      let endDate = new Date(req.body.value)
      let isoString = endDate.toISOString()
      update = { endDate: new Date(isoString.split('T')[0]) }
    }

    return Order
      .update(query, update)
      .then(result => {
        if (updatePriceAndProfit) {
          return Order
          .findOne(query)
          .populate('orderEntries')
          .then(order => {
            let price = 0
            let profit = 0
            _.map(order.orderEntries, entry => {
              price = (price * 1000 + entry.pagesCount * 1000 * entry.pricePerPage) / 1000
              profit = (profit * 1000 + ((entry.pagesCount * 1000 * entry.pricePerPage) - (entry.pagesCount * 1000 * entry.honoraryPerPage))) / 1000
            })

            price = order.stateTax ? (price * 1000 + order.stateTax * 1000) / 1000 : price
            price = order.companyTax ? (price * 1000 + order.companyTax * 1000) / 1000 : price

            profit = order.companyTax ? (profit * 1000 + order.companyTax * 1000) / 1000 : profit
            return Order
            .update(
              { _id: order._id },
              { price: price, profit: profit }
            )
            .then(result => {
              let totalTax = order.stateTax ? order.stateTax : 0
              totalTax = order.companyTax ? (totalTax * 1000 + order.companyTax * 1000) / 1000 : totalTax
              res.json({ newPrice: price, newProfit: profit, totalTax: totalTax })
            })
          })
        }
        
        if (req.body.name === 'endDate' || req.body.name === 'isDone' || req.body.name === 'isPaid') {
          res.json(update)
        } else {
          res.json(result)
        }
      })
      .catch(err => {
        console.log(err)
        res.json(err)
      })
  },
  delete: (req, res) => {
    let query = { _id: req.params.id }
    let update = { isDeleted: true }
    return Order
      .update(query, update)
      .then(result => {
        return Translator.find({
          'notPaidOrders.orderId': req.params.id
        })
      })
      .then(translators => {
        _.map(translators, (translator, i) => {
          _.map(translator.notPaidOrders, (notPaidOrder, j) => {
            if (notPaidOrder.orderId === req.params.id) {
              translators[i].notPaidOrders[j].notPaidAmount = 0
            }
          })
        })

        return saveAllTranslators(translators)
      })
      .then(result => {
        res.json('success')
      })
      .catch(err => {
        console.log(err)

        res.json(err)
      })
  },
  listStatuses: (req, res) => {
    let statuses = [
      {
        value: true,
        text: 'Готова'
      },
      {
        value: false,
        text: 'Не е готова'
      }
    ]

    return res.json(statuses)
  },
  isPaidList: (req, res) => {
    let isPaidList = [
      {
        value: true,
        text: 'Платена'
      },
      {
        value: false,
        text: 'Не е платена'
      }
    ]

    return res.json(isPaidList)
  },
  pdf: (req, res) => {
    let id = req.params.id
    return Order
    .findById(id)
    .populate('customer')
    .then(order => {
      order.paid = order.isPaid ? 'Да' : 'Не е платена'
      order.status = order.isDone ? 'Готова' : 'Не е готова'
      order.date = formatDate(order.startDate)
      order.dueDate = formatDate(order.endDate)
      res.render('templates/order-pdf-template', { order: order }, (err, html) => {
        if (err) throw err

        pdf.create(html).toFile('./pdf/order.pdf', (err, result) => {
          if (err) throw err

          fs.readFile('./pdf/order.pdf', (err, pdf) => {
            if (err) throw err

            res.contentType('application/pdf')
            res.send(pdf)
          })
        })
      })
    })
  },
  markAsPaid: (req, res) => {
    let query = { _id: req.params.id }
    let update = {
      isPaid: true,
      status: 'ready'
    }

    Order.update(query, update)
    .then(order => {
      res.send('Done')
    })
    .catch(error => {
      console.log(error)

      res.status(500).send('Error')
    })
  },
  aggregateOrdersPerCustomer: (req, res) => { 
    let filter = {}
    if (req.query.fromDate && req.query.toDate) {
      let fromDateAsArray = req.query.fromDate.split('-')
      let fromDate = new Date(`${fromDateAsArray[2]}-${fromDateAsArray[1]}-${fromDateAsArray[0]}`)
      let toDateAsArray = req.query.toDate.split('-')
      let toDate = new Date(`${toDateAsArray[2]}-${toDateAsArray[1]}-${toDateAsArray[0]}`)
      filter = {
        startDate: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate)
        }
      }
    }

    let data = []

    return Order.aggregate(
      {
        $match: filter
      },
      { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customer' } },
      { $group: { _id: '$customer', profit: { $sum: '$profit' } } }
    )
    .then(results => {
      data = results
      filter.customerName = { $ne: null }
      return Order.aggregate(
        {
          $match: filter
        },
        {
          $group: { _id: '$customerName', profit: { $sum: '$profit' } }
        }
      )
    })
    .then(results => {
      data = data.concat(results)
      if (req.query.format) {
        data = formatter[req.query.format].profitByCustomer(data)
      }

      return res.json(data)
    })
  },
  notPaidOrdersPdf: (req, res) => {
    let query = { isPaid: false, isDeleted: false }
    if (req.query.customer) {
      query.customer = req.query.customer
    }

    return Order.find(query)
    .populate('customer')
    .populate({
      path: 'orderEntries',
      model: 'OrderEntry',
      populate: [
        {
          path: 'translateFrom',
          model: 'Language'
        },
        {
          path: 'translateTo',
          model: 'Language'
        }]
    })
    .then(orders => {
      let total = 0
      for (let order of orders) {
        let pagesCountTotal = 0
        _.map(order.orderEntries, entry => {
          pagesCountTotal += entry.pagesCount ? entry.pagesCount : 0
        })
        order.pagesCountTotal = pagesCountTotal
        order.docType = order.orderEntries[0].docType
        order.translateFrom = order.orderEntries[0].translateFrom ? order.orderEntries[0].translateFrom.name.substring(0, 3) + '.' : ''
        order.translateTo = order.orderEntries[0].translateTo ? order.orderEntries[0].translateTo.name.substring(0, 3) + '.' : ''
        order.pricePerPage = order.orderEntries[0].pricePerPage ? order.orderEntries[0].pricePerPage : 0
        order.date = formatDate(order.startDate)
        total = (total * 1000 + order.price * 1000) / 1000
      }

      let data = {
        orders: orders,
        total: total
      }

      res.render('templates/not-paid-orders', { data: data }, (er, html) => {
        if (er) {
          console.log('html saving er')
          console.log(er)

          res.redirect('/orders')
        }

        pdf.create(html).toFile('./pdf/not-paid-orders.pdf', (er, result) => {
          if (er) {
            console.log('create pdf to file er')
            console.log(er)
            
            res.redirect('/orders')
          }

          fs.readFile('./pdf/not-paid-orders.pdf', (er, pdf) => {
            if (er) {
              console.log('read file er')
              console.log(er)
              
              res.redirect('/orders')
            }

            res.contentType('application/pdf')
            res.send(pdf)
          })
        })
      })
    })
    .catch(console.log)
  },
  payAll: (req, res) => {
    return Order.update(
        { customer: req.params.customer, isDeleted: false, isPaid: false },
        { isPaid: true, invoiceNumber: req.body.invoiceNumber },
        { multi: true }
      )
      .then(result => {
        res.json('success')
      })
      .catch(er => {
        console.log(er)
        res.status(500).json('error')
      })
  },
  notPaidHonoraryOrdersByTranslator: (req, res) => {
    return Translator
      .findById(req.params.translatorId)
      .then(translator => {
        let orderIds = []
        let notPaidTranslator = {}
        _.map(translator.notPaidOrders, notPaidOrder => {
          if (!notPaidOrder.notPaidAmount) return

          orderIds.push(notPaidOrder.orderId)
          notPaidTranslator[notPaidOrder.orderId] = notPaidOrder.notPaidAmount
        })
        return Order.find({ _id: { $in: orderIds } })
        .then(orders => {
          let data = orders
          if (req.query.format) {
            data = formatter[req.query.format].notPaidHonoraryOrdersByTranslator(orders, notPaidTranslator)
          }

          res.json(data)
        })
      })
  },
  notPaidHonoraryByTranslatorPdf: (req, res) => {
    return Translator
      .findById(req.params.translatorId)
      .then(translator => {
        let orderIds = []
        let notPaidTranslator = {}
        _.map(translator.notPaidOrders, notPaidOrder => {
          orderIds.push(notPaidOrder.orderId)
          notPaidTranslator[notPaidOrder.orderId] = notPaidOrder.notPaidAmount
        })
        return Order.find({ _id: { $in: orderIds } })
        .then(orders => {

        for (let order of orders) {
          order.cust = order.customer ? order.customer.name : order.customerName
          order.date = formatDate(order.startDate)
          order.dueDate = formatDate(order.endDate)
        }
        
        res.render('templates/not-paid-honorary', { orders: orders }, (er, html) => {
          if (er) {
            console.log('html saving er')
            console.log(er)

            res.redirect('/orders')
          }

          pdf.create(html).toFile('./pdf/not-paid-honorary.pdf', (er, result) => {
            if (er) {
              console.log('create pdf to file er')
              console.log(er)
              
              res.redirect('/orders')
            }

            fs.readFile('./pdf/not-paid-honorary.pdf', (er, pdf) => {
              if (er) {
                console.log('read file er')
                console.log(er)
                
                res.redirect('/orders')
              }

              res.contentType('application/pdf')
              res.send(pdf)
            })
          })
        })
      })
      .catch(er => {
        console.log(er)
      })
    })
    .catch(er => {
      console.log(er)
    })
  },
  notPaidOrdersGroupedByCustomer: (req, res) => {
    let data = []
    let filter = { isDeleted: false, isPaid: false }
    return Order.aggregate(
      { $match: filter },
      { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customer' } },
      { $group: { _id: '$customer', price: { $sum: '$price' } } }
    )
    .then(results => {
      data = results
      filter.customerName = { $ne: null }
      return Order.aggregate(
        {
          $match: filter
        },
        {
          $group: { _id: '$customerName', price: { $sum: '$price' } }
        }
      )
    })
    .then(results => {
      data = data.concat(results)
      if (req.query.format) {
        data = formatter[req.query.format].notPaidByCustomer(data)
      }

      return res.json(data)
    })
  },
  archive: (req, res) => {
    return Order.update({_id: req.params.id}, {isArchived: true})
      .then(result => {
        return res.send('success')
      })
      .catch(er => {
        console.log(er)

        return res.status(500).send('error')
      })
  },
  unarchive: (req, res) => {
    return Order.update({_id: req.params.id}, {isArchived: false})
      .then(result => {
        return res.send('success')
      })
      .catch(er => {
        console.log(er)

        return res.status(500).send('error')
      })
  }
}

let transformOrdersJson = (dataTablesParam, ordersJsonData, roles) => {
  if (dataTablesParam === 'dataTables') {
    return dataTablesConverter.convertOrders(ordersJsonData)
  } else {
    if (roles.indexOf('admin') === -1) {
      ordersJsonData[0].profit = null
    }

    return ordersJsonData
  }
}

let saveAllTranslators = (translators) => {
  let results = []
  let saveTranslator = () => {
    let translator = translators.pop()
    return translator.save()
      .then(result => {
        results.push(result)
        if (translators.length) {
          return saveTranslator()
        }

        return Promise.resolve(results)
      })
      .catch(er => {
        return Promise.reject(er)
      })
  }

  return new Promise((resolve, reject) => {
    return saveTranslator()
      .then(result => {
        resolve(result)
      })
      .catch(er => {
        reject(er)
      })
  })
}

let formatDate = (date) => {
  if (!date) {
    return 'Няма'
  }

  let months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

  let month = months[date.getMonth()]
  month = month.toString().length === 1 ? '0' + month : month
  let day = date.getDate()
  day = day.toString().length === 1 ? '0' + day : day
  let formatedDate = day + '.' + month

  return formatedDate
}

let updateTranslatorHonorary = (notPaidHonoraries, orderId) => {
  return new Promise((resolve, reject) => {
    let hasRegisteredTranslator = false
    for (let translatorId in notPaidHonoraries) {
      if (ObjectId.isValid(translatorId)) {
        hasRegisteredTranslator = true
      } else {
        continue
      }

      Translator
      .findById(translatorId)
      .then(translator => {
        let newNotPaidHonorary =
          (translator.notPaidHonorary * 1000 + notPaidHonoraries[translatorId] * 1000) / 1000
        let notPaidOrders = translator.notPaidOrders
        notPaidOrders.push({ orderId: orderId, notPaidAmount: notPaidHonoraries[translatorId] })

        return Translator
        .update(
          { _id: translatorId },
          { notPaidHonorary: newNotPaidHonorary, notPaidOrders: notPaidOrders }
        )
        .then(result => {
          resolve()
        })
        .catch(er => {
          console.log(er)

          reject()
        })
      })
      .catch(er => {
        console.log(er)

        reject()
      })
    }

    if (!hasRegisteredTranslator) {
      resolve()
    }
  })
}
