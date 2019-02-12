module.exports = {
  index: (req, res) => {
    res.render('insights/view', { user: req.user })
  }
}
