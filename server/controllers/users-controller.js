let User = require('mongoose').model('User')
let encryption = require('./../utilities/encryption')
let formatter = require('./../utilities/formatter')
let _ = require('lodash')

module.exports = {
  index: (req, res) => {
    let notification = req.session.notification
    delete req.session.notification
    res.render('users/list', { notification: notification, user: req.user })
  },
  list: (req, res) => {
    User.find({ isDeleted: false, roles: { $nin: ['superadmin'] }}, 'username firstName lastName')
    .then(users => {
      let data
      if (req.query.format) {
        data = formatter[req.query.format].users(users)
      }

      res.json(data)
    })
  },
  create: (req, res) => {
    let user = req.body
    user.salt = encryption.generateSalt()
    user.hashedPassword = encryption.generateHashedPassword(user.salt, user.password)

    if (!user.roles) {
      user.roles = ['user']
    }

    User.find({
      isDeleted: true,
      username: user.username
    })
    .then(userResult => {
      if (userResult.length === 0) {
        User
        .create(user)
        .then(user => {
          req.session.notification = { type: 'success', message: `User ${user.username} has been created successfully!` }
          res.redirect('/users')
        })
        .catch(err => {
          req.session.notification = { type: 'warning', message: `User ${user.username} exists!` }
          res.redirect('/users')
        })
      } else {
        let update = user
        update.isDeleted = false

        User
        .update({ isDeleted: true, username: user.username }, update)
        .then(result => {
          req.session.notification = { type: 'success', message: `User ${user.username} has been created successfully!` }
          res.redirect('/users')
        })
        .catch(err => {
          req.session.notification = { type: 'warning', message: `User ${user.username} exists!` }
          res.redirect('/users')
        })
      }
    })
    .catch(err => {
      console.log(err)
    })
  },
  update: (req, res) => {
    if (req.query.xedit) {
      let query = { _id: req.body.pk }
      let names = req.body.value.split(' ')
      let update = { firstName: names[0], lastName: names[1] }
      User.update(query, update)
        .then(result => {
          res.json('success')
        })
        .catch(err => {
          console.log(err)
          res.status(500).json('An error occured!')
        })
    }
  },
  delete: (req, res) => {
    let query = { _id: req.params.id }
    let update = { isDeleted: true }
    User.update(query, update)
      .then(result => {
        res.json('success')
      })
      .catch(err => {
        console.log(err)
        res.status(500).json('error')
      })
  },
  login: (req, res) => {
    if (req.user) {
      res.redirect('/')
      return
    }

    let loginMessage = req.session.loginMessage
    delete req.session.loginMessage

    res.render('./users/login', { loginMessage: loginMessage })
  },
  authenticate: (req, res) => {
    let inputUser = req.body

    User
      .findOne({ username: inputUser.username, isDeleted: false })
      .then(user => {
        if (!user || !user.authenticate(inputUser.password)) {
          req.session.loginMessage = 'You have entered an invalid username or password!'
          res.redirect('/users/login')
        } else {
          req.logIn(user, (err, user) => {
            if (err) {
              req.session.loginMessage = 'Ooops there is a problem with the authentication!'
              res.redirect('/users/login')
              return
            }

            res.redirect('/')
          })
        }
      })
  },
  logout: (req, res) => {
    req.logout()
    res.redirect('/users/login')
  },
  sidebar: (req, res) => {
    let routes = [
      {
        title: 'Клиенти',
        path: '/customers',
        role: 'user',
        icon: 'suitcase',
        dataRoute: 'customer'
      },
      {
        title: 'Преводачи',
        path: '/translators',
        role: 'user',
        icon: 'comments-o',
        dataRoute: 'translator'
      },
      {
        title: 'Езици',
        path: '/languages',
        role: 'admin',
        icon: 'language',
        dataRoute: 'language'
      },
      {
        title: 'Поръчки',
        path: '/orders',
        role: 'user',
        icon: 'file-text',
        dataRoute: 'order'
      },
      {
        title: 'Потребители',
        path: '/users',
        role: 'admin',
        icon: 'users',
        dataRoute: 'user'
      },
      {
        title: 'Репорт',
        path: '/insights',
        role: 'admin',
        icon: 'bar-chart',
        dataRoute: 'insight'
      },
      {
        title: 'Неплатени Поръчки',
        path: '/not-paid-orders',
        role: 'user',
        icon: 'file',
        dataRoute: 'not-paid-order'
      },
      {
        title: 'Типове Документи',
        path: '/doc-types',
        role: 'user',
        icon: 'file-text',
        dataRoute: 'doc-type'
      },
      {
        title: 'Неплатен Хонорар',
        path: '/not-paid-honorary',
        role: 'user',
        icon: 'money',
        dataRoute: 'not-paid-honorary'
      },
      {
        title: 'Министерства',
        path: '/ministries',
        role: 'admin',
        icon: 'bank',
        dataRoute: 'ministries'
      },
      {
        title: 'Документи',
        path: '/documents',
        role: 'user',
        icon: 'files-o',
        dataRoute: 'document'
      },
      {
        title: 'Архив',
        path: '/archive',
        role: 'user',
        icon: 'archive',
        dataRoute: 'archive'
      }
    ]
    let userRoutes = []
    _.map(routes, route => {
      if (req.user.roles.indexOf(route.role) > -1) {
        userRoutes.push(route)
      }
    })
    res.render('partials/sidebar/sidebar', { routes: userRoutes })
  }
}
