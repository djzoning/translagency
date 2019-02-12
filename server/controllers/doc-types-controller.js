let DocType = require('mongoose').model('DocType')
let formatter = require('./../utilities/formatter')

module.exports = {
  index: (req, res) => {
    res.render('docTypes/list', { user: req.user })
  },
  list: (req, res) => {
    let query = { isDeleted: false }
    if (req.query.q) {
      query.name = { $regex: req.query.q, $options: 'i' }
    }

    return DocType
    .find(query)
    .then(docs => {
      if (req.query.format) {
        let data = formatter[req.query.format].formatDocs(docs)
        res.json(data)

        return
      }

      res.json(docs)
    })
  },
  create: (req, res) => {
    let document = req.body
    return DocType
    .create(document)
    .then(r => {
      res.redirect('/doc-types')
    })
  },
  delete: (req, res) => {
    return DocType
    .update({ _id: req.params.id }, { isDeleted: true })
    .then(() => {
      res.json('success')
    })
    .catch(er => {
      console.log(er)

      res.status(500).json('error')
    })
  }
}
