module.exports = {
  index: (req, res) => {
    res.redirect('/orders')
  },
  notFound: (req, res) => {
    res.status(404)
    res.render('./home/not-found')
  }
}
