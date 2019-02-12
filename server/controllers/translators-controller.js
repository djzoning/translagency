let Translator = require('mongoose').model('Translator')
let formatter = require('./../utilities/formatter')
let _ = require('lodash')

module.exports = {
  index: (req, res) => {
    res.render('translators/list', { user: req.user })
  },
  notPaidHonoraryView: (req, res) => {
    res.render('translators/not-paid-honorary', { user: req.user })
  },
  notPaidHonoraryByTranslatorView: (req, res) => {
    res.render('translators/not-paid-honorary-by-translator', { translatorId: req.params.id, user: req.user })
  },
  list: (req, res) => {
    let query = { isDeleted: false }
    if (req.params.id) {
      query._id = req.params.id
    }

    if (req.query.language) {
      query.languages = req.query.language
    }

    let re = '.'
    if (req.query.q) {
      re = req.query.q
    }

    if (req.query.reqfrom && req.query.reqfrom === 's2') {
      Translator.aggregate([
        { $project: { name: { $concat: [ '$firstName', ' ', '$lastName' ] }, languages: 1, isDeleted: 1 } },
        { $match: { name: { $regex: re, $options: 'i' }, isDeleted: false } }
      ]).exec((err, result) => {
        if (err) {
          console.log(err)
        }

        let translators = result
        if (req.query.language) {
          translators = []
          _.map(result, translator => {
            _.map(translator.languages, lang => {
              if (lang.toString() === req.query.language) {
                translators.push(translator)
              }
            })
          })
        }

        let data = formatter[req.query.format].translators(translators)
        return res.json(data)
      })
    } else {
      return Translator
        .find(query)
        .populate('languages')
        .then(translators => {
          let data = translators
          if (req.query.format) {
            data = formatter[req.query.format].translators(translators)
          }

          res.json(data)
        })
        .catch(err => {
          console.log(err)
          res.json(err)
        })
    }
  },
  create: (req, res) => {
    return Translator
      .create(req.body)
      .then(result => {
        res.redirect('/translators')
      })
      .catch(err => {
        console.log(err)
        res.redirect('/translators')
      })
  },
  update: (req, res) => {
    let query = { _id: req.params.id }
    let update = req.body

    if (req.query.xedit) {
      query = { _id: req.body.pk }
      update = {}
      update[req.body.name] = req.body.value
    }

    Translator
      .update(query, update)
      .then(result => {
        res.json(result)
      })
      .catch(err => {
        console.log(err)
        res.json(err)
      })
  },
  delete: (req, res) => {
    let query = { _id: req.params.id }

    Translator
      .update(query, { isDeleted: true })
      .then(result => {
        res.json('success')
      })
      .catch(err => {
        console.log(err)
        res.status(500).json('error')
      })
  },
  notPaidHonorary: (req, res) => {
    let query = { 'notPaidOrders.0': { $exists: true } }
    let translatorsArray = []
    return Translator
    .find(query)
    .then(translators => {
      _.map(translators, translator => {
        let isFound = false
        _.map(translator.notPaidOrders, notPaidOrder => {
          if (notPaidOrder.notPaidAmount > 0) {
            isFound = true
          }
        })
        if (isFound) {
          translatorsArray.push(translator)
        }
      })
      let data = translators
      if (req.query.format) {
        data = formatter[req.query.format].notPaidHonorary(translatorsArray)
      }

      res.json(data)
    })
    .catch(er => {
      console.log(er)
    })
  },
  payHonorary: (req, res) => {
    let query = {
      _id: req.params.translatorId
    }
    let update = {
      notPaidOrders: []
    }

    return Translator
    .update(query, update)
    .then(result => {
      return res.json('success')
    })
    .catch(er => {
      console.log(er)
      
      return res.status(500).json('error')
    })
  }
}
