module.exports = {
  convertOrderTypes: (orderTypes) => {
    let data = { results: [] }
    let orderType
    for (let i in orderTypes) {
      orderType = {
        id: orderTypes[i].name,
        text: orderTypes[i].name
      }
      data.results.push(orderType)
    }

    return data
  }
}
