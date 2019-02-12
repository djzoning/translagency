let Ministry = require('mongoose').model('Ministry')
let formatter = require('./../utilities/formatter')

module.exports = {
  index: (req, res) => {
    res.render('ministries/list', { user: req.user })
  },
  list: (req, res) => {
    let query = { isDeleted: false }
    if (req.query.q) {
      query.name = { $regex: req.query.q, $options: 'i' }
    }

    return Ministry
    .find(query)
    .then(ministries => {
      if (req.query.format) {
        let data = formatter[req.query.format].ministries(ministries)
        res.json(data)

        return
      }

      res.json(docs)
    })
  },
  create: (req, res) => {
    let ministry = req.body
    return Ministry
    .create(ministry)
    .then(r => {
      res.redirect('/ministries')
    })
    .catch(er => {
      console.log(er)

      res.redirect('/ministries')
    })
  },
  delete: (req, res) => {
    return Ministry
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
