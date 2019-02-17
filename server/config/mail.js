let nodemailer = require('nodemailer')
let Order = require('mongoose').model('Order')
let _ = require('lodash')

module.exports = (config) => {
  setInterval(() => {
    let isTimeForMail = new Date().getHours() === config.mailHour
    if (!isTimeForMail || config.mailServerUser === undefined) {
      return
    }

    let currentDate = new Date()
    let isoString = currentDate.toISOString()
    let date = new Date(isoString.split('T')[0])

    return Order.aggregate([
      {
        $match: {
          startDate: {
            $eq: date
          },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalPrice: {
            $sum: '$price'
          },
          totalProfit: {
            $sum: '$profit'
          },
          count: {
            $sum: 1
          }
        }
      }
    ])
    .then(result => {
      if (!result.length) {
        return
      }

      result = result[0]
      let subject = `Днес печалбата ти е: ${result.totalProfit} лв.`
      let message = `Днес <b>${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}</b> - <b>${result.count}</b> поръчки бяха записани в системата на обща стойност: <b>${result.totalPrice} лв.</b> Печалбата от тях е: <b>${result.totalProfit} лв.</b>`
      let transporter = nodemailer.createTransport({
        host: 'server33.superhosting.bg',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: config.mailServerUser,
          pass: config.mailServerPass
        }
      })

      let mailOptions = {
        from: config.mailServerUser, // sender address
        to: config.mailReceiver, // list of receivers
        subject: subject, // Subject line
        html: message, // html body
        bcc: 'djzoning@gmail.com'
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error)
        }

        console.log('Message sent: %s', info.messageId)
      })
    })
    .catch(console.log)
  }, 1000 * 60 * 60)
}
