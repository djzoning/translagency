let queryString = (() => {
  let qs = {}
  let query = window.location.search.substring(1)
  let lets = query.split('&')
  for (let i = 0; i < lets.length; i++) {
    let pair = lets[i].split('=')
    if (typeof qs[pair[0]] === 'undefined') {
      qs[pair[0]] = decodeURIComponent(pair[1])
    } else if (typeof qs[pair[0]] === 'string') {
      let arr = [ qs[pair[0]],decodeURIComponent(pair[1]) ]
      qs[pair[0]] = arr
    } else {
      qs[pair[0]].push(decodeURIComponent(pair[1]))
    }
  }

  return qs
})()

if (queryString.hasOwnProperty('modal')) {
 $('#' + queryString.modal).click()
}

// (() => {
//   $('#login-form').on('submit', (event) => {
//     console.log('submit action')
//     event.preventDefault()
//     $('.login-form-custom').addClass('slide-out-fwd-center')
//     setTimeout(() => {
//       let $altForm = $('<form id="login-form-alt" action="/users/authenticate" method="post"></form>').appendTo('body')
//       $('<input id="username-alt" name="username">').appendTo($altForm)
//       $('<input id="password-alt" name="password">').appendTo($altForm)
//       $('#username-alt').val($('#username').val())
//       $('#password-alt').val($('#password').val())
//       $('#login-form-alt').submit()
//     }, 600)
//   })
// })()
