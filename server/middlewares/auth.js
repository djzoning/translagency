module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      next()
    } else {
      res.redirect('/users/login')
    }
  },
  isInRole: (role) => {
    return (req, res, next) => {
      if (req.user && req.user.roles.indexOf(role) > -1) {
        next()
      } else {
        // TODO: Send the user to not authorized page
        res.redirect('/users/login')
      }
    }
  }
}
