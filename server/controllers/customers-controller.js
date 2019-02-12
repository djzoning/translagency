let Customer = require('mongoose').model('Customer')
let dataTablesConverter = require('./../utilities/datatable-converter')
let formatter = require('./../utilities/formatter')
let _ = require('lodash')

module.exports = {
  index: (req, res) => {
    let locals = req.session.locals || {}
    delete req.session.locals
    res.render('customers/list', { locals: locals, user: req.user })
  },
  details: (req, res) => {
    res.render('customers/details', { user: req.user })
  },
  create: (req, res) => {
    Customer
      .create({
        name: req.body.name,
        senders: req.body.senders,
        nsn: req.body.nsn,
        address: req.body.address,
        email: req.body.email,
        phone: req.body.phone,
        contactPerson: req.body.contactPerson,
        pin: req.body.pin,
        isCompany: req.body.isCompany
      })
      .then(result => {
        console.log('Successful create of a customer')
        res.redirect('/customers')
      })
      .catch(err => {
        console.log('Catch Error: ')
        console.log(err)
        req.session.locals = req.body
        res.redirect('/customers?modal=add-new-customer')
      })
  },
  list: (req, res) => {
    let query = { isDeleted: false }
    if (req.params.id) {
      query._id = req.params.id
    }

    if (req.query.q) {
      query.name = { $regex: req.query.q, $options: 'i' }
    }

    if (req.query.hasOwnProperty('page')) {
      let page = req.query.page
      let limit = 10

      if (req.query.hasOwnProperty('limit')) {
        limit = parseInt(req.query.limit)
      }

      Customer
        .paginate(query, { page: page, limit: limit })
        .then(customers => {
          let data = dataTablesConverter.convertCustomers(customers)

          res.json(data)
        })
        .catch(error => {
          console.log(error)
          res.json(error)
        })
    } else {
      Customer
        .find(query)
        .then(customers => {
          let data = customers
          if (req.query.format) {
            data = formatter[req.query.format].customers(customers)
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
    if (req.query.xedit) {
      update = {}
      update[req.body.name] = req.body.value
    }

    Customer
      .update(query, update)
      .then(result => {
        res.json('success')
      })
      .catch(err => {
        console.log('Catch Error: ')
        console.log(err)
        res.json('error')
      })
  },
  updateSenders: (req, res) => {
    let query = {_id: req.params.id}
    let senders = req.body.value.split(',')
    _.map(senders, (sender, i) => {
      senders[i] = sender.trim()
    })
    let update = {senders: senders}
    return Customer.update(query, update)
      .then(result => {
        res.json('success')
      })
      .catch(er => {
        console.log(er)
        res.status(500).json('error')
      })
  },
  delete: (req, res) => {
    let query = { _id: req.params.id }
    let update = { isDeleted: true }
    Customer
      .update(query, update)
      .then(result => {
        res.json('success')
      })
      .catch(error => {
        console.log(error)
        res.status(500).json('error')
      })
  },
  createTestCustomers: (req, res) => {
    for (let i = 0; i < 100; i++) {
      let name = 'test name ' + i
      let nsn = 'test nsn ' + i
      let address = 'test address ' + i
      let email = 'testemail' + i + '@abv.bg'
      let phone = '123123123' + i
      let contactPerson = 'test contact person ' + i
      let pin = 'test pin ' + i
      let isCompany = i % 2 === 1

      Customer
        .create({
          name: name,
          nsn: nsn,
          address: address,
          email: email,
          phone: phone,
          contactPerson: contactPerson,
          pin: pin,
          isCompany: isCompany
        })
        .then(result => {
          console.log('Successful create of a customer')
        })
        .catch(err => {
          console.log('Catch Error: ')
          console.log(err)
        })
    }
  },
  senders: (req, res) => {
    return Customer
      .findById(req.params.id)
      .then(customer => {
        let data = customer
        if (req.query.format) {
          data = formatter[req.query.format].senders(customer.senders)
        }

        res.json(data)
      })
      .catch(error => {
        console.log(error)
        
        res.json(error)
      })
  }
}
