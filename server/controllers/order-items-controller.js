let Order = require('mongoose').model('Order')
let Translator = require('mongoose').model('Translator')
let OrderEntry = require('mongoose').model('OrderEntry')
let _ = require('lodash')

module.exports = {
  update: (req, res) => {
    let update = {}
    update[req.body.name] = req.body.value

    OrderEntry
    .update({ _id: req.body.pk }, update)
    .then(result => {
      if (result.ok !== 1) {
        return res.status(500).json('error')
      }

      if (req.body.name !== 'pagesCount' && req.body.name !== 'pricePerPage' && req.body.name !== 'honoraryPerPage') {
        return res.json('success')
      }

      return Order
      .findOne({ orderEntries: { $in: [req.body.pk] } })
      .populate('orderEntries')
      .then(order => {
        let newPrice = 0
        let newProfit = 0
        let newHonorary = 0
        let newTranslationsProfit = 0
        let translatorsHonorary = {}
        _.map(order.orderEntries, entry => {
          translatorsHonorary[entry.translator] = 0
        })
        _.map(order.orderEntries, entry => {
          newPrice += entry.pagesCount * 100 * entry.pricePerPage / 100
          newProfit += ((entry.pagesCount * 100 * entry.pricePerPage) - (entry.pagesCount * 100 * entry.honoraryPerPage)) / 100
          newHonorary += entry.pagesCount * 100 * entry.honoraryPerPage / 100
          translatorsHonorary[entry.translator] += entry.pagesCount * 100 * entry.honoraryPerPage / 100
        })
        _.map(order.orderEntries, entry => {
          if (!entry.translator) {
            return
          }
          return Translator.find({ _id: entry.translator })
            .then(translator => {
              let isFound = false
              _.map(translator[0].notPaidOrders, (notPaidOrder, i) => {
                if (notPaidOrder.orderId === order._id.toString()) {
                  isFound = true
                  translator[0].notPaidOrders[i].notPaidAmount = translatorsHonorary[entry.translator]
                }
              })
              if (!isFound) {
                translator[0].notPaidOrders.push({ orderId: order._id, notPaidAmount: translatorsHonorary[entry.translator] })
              }
              translator[0].save().catch(er => {
                console.log(er)

                return res.status(500).end()
              })
            })
            .catch(er => {
              console.log(er)

              return res.status(500).end()
            })
        })
        newTranslationsProfit = newProfit
        newPrice += order.stateTax ? order.stateTax : 0
        newPrice += order.companyTax ? order.companyTax : 0
        newProfit += order.companyTax ? order.companyTax : 0
        Order.update({ _id: order._id }, { price: newPrice, profit: newProfit })
        .then(result => {
          if (result.ok === 1) {
            res.json({ newPrice: newPrice, newProfit: newProfit, newHonorary: newHonorary, newTranslationsProfit: newTranslationsProfit })

            return
          }

          res.status(500).json('error')
        })
        .catch(er => {
          console.log(er)
          res.status(500).json('error')
        })
      })
      .catch(er => {
        console.log(er)
        res.status(500).json('error')
      })
    })
    .catch(er => {
      console.log(er)
      res.status(500).json('error')
    })
  },
  updateTranslator: (req, res) => {
    let entry, order
    return OrderEntry.findById(req.body.pk)
      .then(e => {
        entry = e
        return Order.find({orderEntries: entry._id})
      })
      .then(o => {
        order = o[0]
        return Translator.findById(entry.translator)
      })
      .then(oldTranslator => {
        if (!oldTranslator) return

        _.map(oldTranslator.notPaidOrders, (notPaidOrder, i) => {
          if (notPaidOrder.orderId === order._id.toString()) {
            let honorary = entry.pagesCount * 1000 * entry.honoraryPerPage / 1000
            oldTranslator.notPaidOrders[i].notPaidAmount = (notPaidOrder.notPaidAmount * 1000 - honorary * 1000) / 1000
            if (oldTranslator.notPaidOrders[i].notPaidAmount < 0) {
              oldTranslator.notPaidOrders[i].notPaidAmount = 0
            }
          }
        })

        return oldTranslator.save()
      })
      .then(result => {
        return Translator.findById(req.body.value)
      })
      .then(newTranslator => {
        let honorary = entry.honoraryPerPage * 1000 * entry.pagesCount / 1000
        let isFound = false
        _.map(newTranslator.notPaidOrders, (notPaidOrder, i) => {
          if (notPaidOrder.orderId === order._id.toString()) {
            isFound = true
            newTranslator.notPaidOrders[i].notPaidAmount = (newTranslator.notPaidOrders[i].notPaidAmount * 1000 + honorary * 1000) / 1000
          }
        })
        if (!isFound) {
          newTranslator.notPaidOrders.push({orderId: order._id, notPaidAmount: honorary})
        }

        return newTranslator.save()
      })
      .then(result => {
        entry.translator = result._id

        return entry.save()
      })
      .then(result => {
        return res.json('success')
      })
      .catch(er => {
        console.log(er)

        return res.status(500).end()
      })
  }
}
