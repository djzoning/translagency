let Language = require('mongoose').model('Language')
let formatter = require('./../utilities/formatter')
let _ = require('lodash')

module.exports = {
  index: (req, res) => {
    res.render('languages/list', { user: req.user })
  },
  create: (req, res) => {
    Language
      .create({ 
        name: req.body.name,
        price: req.body.price
      })
      .then(res.redirect('/languages'))
      .catch(console.log)
  },
  list: (req, res) => {
    let query = {}
    if (req.query.q) {
      query.name = { $regex: req.query.q, $options: 'i' }
    }

    return Language
      .find(query)
      .sort({name: 1})
      .then(langs => {
        let data
        if (req.query.format) {
          data = formatter[req.query.format].languages(langs)
        } else {
          data = langs
        }

        res.json(data)
      })
      .catch(console.log)
  },
  update: (req, res) => {
    let query = { name: req.body.pk }
    let update = { price: req.body.value }
    return Language.update(query, update)
      .then(result => {
        console.log(result)
        res.status(200).end()
      })
      .catch(err => {
        console.log(err)
        res.status(500).json('error')
      })
  },
  getPrice: (req, res) => {
    let languages = [req.query.languageFrom, req.query.languageTo]

    return Language.find({ _id: { $in: languages }})
    .then(languages => {
      let hasBulgarian = false
      let price
      _.map(languages, language => {
        if (language.name.toLowerCase() === 'български') {
          hasBulgarian = true
        } else {
          price = language.price
        }
      })
      if (!hasBulgarian) {
        res.status(400).json('Bulgarian is not selected!')
      }

      res.json(price)
    })
  }
}
