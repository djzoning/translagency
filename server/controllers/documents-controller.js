let Document = require('mongoose').model('Document')
let formatter = require('./../utilities/formatter')

module.exports = {
  index: (req, res) => {
    res.render('documents/list', { user: req.user })
  },
  list: (req, res) => {
    let query = { isDeleted: false }
    if (req.query.q) {
      query.name = { $regex: req.query.q, $options: 'i' }
    }

    return Document
    .find(query)
    .then(docs => {
      if (req.query.format) {
        let data = formatter[req.query.format].documents(docs)
        res.json(data)

        return
      }

      res.json(docs)
    })
  },
  create: (req, res) => {
    let currentDate = new Date()
    let isoString = currentDate.toISOString()
    let date = new Date(isoString.split('T')[0])
    let document = req.body
    document.date = date

    if (document.submissionDate) {
      let submissionDateAsArray = document.submissionDate.split('-')
      document.submissionDate = new Date(`${submissionDateAsArray[2]}-${submissionDateAsArray[1]}-${submissionDateAsArray[0]}`)
    } else {
      document.submissionDate = ''
    }

    if (document.returnDate) {
      let returnDateAsArray = document.returnDate.split('-')
      document.returnDate = new Date(`${returnDateAsArray[2]}-${returnDateAsArray[1]}-${returnDateAsArray[0]}`)
    } else {
      document.returnDate = ''
    }

    return Document
    .create(document)
    .then(r => {
      res.redirect('/documents')
    })
    .catch(er => {
      console.log(er)

      res.redirect('/documents')
    })
  },
  delete: (req, res) => {
    return Document
    .update({ _id: req.params.id }, { isDeleted: true })
    .then(() => {
      res.json('success')
    })
    .catch(er => {
      console.log(er)

      res.status(500).json('error')
    })
  },
  update: (req, res) => {
    if (req.query.xedit) {
      let query = { _id: req.params.id }
      let update = {}
      update[req.body.name] = req.body.value

      if (req.body.name === 'returnDate' || req.body.name === 'submissionDate') {
        let date = new Date(req.body.value)
        let isoString = date.toISOString()
        update = {}
        update[req.body.name] = new Date(isoString.split('T')[0])
      }

      return Document.update(query, update)
      .then(() => {
        res.json(update)
      })
      .catch(er => {
        console.log(er)

        res.status(500).json('error')
      })
    } else {
      res.end()
    }
  }
}
