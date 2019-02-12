$(() => {

  let rowClickedOrder = (event) => {
    let orderId = $(event.currentTarget).children().first().children().data('id')
    window.location.href = `/order/${orderId}`
  }

  let rowClickedCustomer = (event) => {
    let orderId = $(event.currentTarget).children().first().children().data('id')
    window.location.href = `/customer/${orderId}`
  }

  let rowClickedNotPaidHonorary = (event) => {
    let translatorId = $(event.currentTarget).children().first().children().data('id')
    window.location.href = `/not-paid-honorary/${translatorId}`
  }

  let rowClicketNotPaidOrdersByCustomer = (event) => {
    let customerId = $(event.currentTarget).children().first().children().data('id')
    if (!customerId) return

    window.location.href = `/not-paid-orders/${customerId}`
  }

  let callbacks = {
    rowCallbackOrder: (row) => {
      $(row).click(rowClickedOrder)
      $(row).find('td:nth-child(7),td:nth-child(8)').click(event => {
        event.stopPropagation()
      })
      let $priceTd = $(row).find('td:nth-child(9)')

      if (!$priceTd.text().includes('лв')) $priceTd.append(' лв.')

      $(row).find('.dropdown').click(event => {
        event.stopPropagation()
        let isClicked = $(event.target).data('clicked')
        if (isClicked) {
          return
        }

        $(event.target).data('clicked', true)

        let id = $(event.target).data('id')
        $(event.target).editable({
          type: 'select',
          source: $(event.target).data('source'),
          url: `/api/orders/${id}?xedit=true`,
          name: $(event.target).data('field'),
          pk: id,
          ajaxOptions: {
            type: 'put'
          },
          success: res => {
            setTimeout(() => {
              if (res.isDone) {
                if (JSON.parse(res.isDone)) {
                  $(event.target).html('<span class="done">Готова</span>')
                } else {
                  $(event.target).html('<span class="not-done">Не е готова</span>')
                }
              }

              if (res.isPaid) {
                if (JSON.parse(res.isPaid)) {
                  $(event.target).html('<span class="done">Платена</span>')
                } else {
                  $(event.target).html('<span class="not-done">Не е платена</span>')
                }
              }
            }, 10)
            miniToastr.success('Поръчката е редактирана успешно!')
          },
          error: () => {
            miniToastr.error('Възникна грешка на сървъра!')
          }
        })

        isClicked = true
        $(event.target).click()
      })
      
    },
    rowCallbackCustomer: (row) => {
      $(row).click(rowClickedCustomer)
    },
    rowCallbackNotPaidHonorary: (row) => {
      $(row).click(rowClickedNotPaidHonorary)
      let $priceTd = $(row).find('td:last-child')
      if (!$priceTd.text().includes('лв')) $priceTd.append(' лв.')
    },
    rowCallbackNotPaidOrdersByCustomer: (row) => {
      $(row).click(rowClicketNotPaidOrdersByCustomer)
      let $priceTd = $(row).find('td:last-child')
      if (!$priceTd.text().includes('лв')) $priceTd.append(' лв.')
    },
    usersTableDrawCallback: () => {
      let $cells = $('table td:first-child div')
      $cells.each((i, cell) => {
        let id = $(cell).data('id')
        $(cell).editable({
          type: 'text',
          url: '/api/users?xedit=true',
          name: 'name',
          pk: id,
          ajaxOptions: {
            type: 'put'
          },
          success: () => {
            miniToastr.init()
            miniToastr.success('The object has been updated successfully!')
          },
          error: () => {
            miniToastr.init()
            miniToastr.error('An error occured!')
          }
        })
      })
    },
    footerCallback: function (row, data, start, end, display) {
        var api = this.api(), data

        // Remove the formatting to get integer data for summation
        var intVal = function ( i ) {
          return typeof i === 'string' ?
            i.replace(/[\$, лв]./g, '')*1 :
            typeof i === 'number' ?
                i : 0
        }

        // Total over all pages
        let total = api
          .column(1)
          .data()
          .reduce((a, b) => {
            return intVal(a) + intVal(b)
          }, 0 )
        // Update footer
        $(api.column(1).footer()).html(
            `${total} лв.`
        )
    },
    footerCallbackNotPaidByCustomer: function (row, data, start, end, display) {
        var api = this.api(), data

        // Remove the formatting to get integer data for summation
        var intVal = function ( i ) {
          return typeof i === 'string' ?
            i.replace(/[\$, лв]./g, '')*1 :
            typeof i === 'number' ?
                i : 0
        }

        // Total over all pages
        let total = api
          .column(11)
          .data()
          .reduce((a, b) => {
            return intVal(a) + intVal(b)
          }, 0 )
        // Update footer
        $(api.column(11).footer()).html(
            `${total} лв.`
        )
    },
    setupReturnDateCallback: () => {
      setupReturnDate()
    },
    unarchiveOrders: () => {
      let unarchiveOrder = (id, target) => {
        $.post(`/api/orders/${id}/unarchive`)
          .done(result => {
            miniToastr.success('Поръчката е разархивирана.')
            $(target).parents('tr').fadeOut(300)
          })
          .error(er => {
            miniToastr.error('Възникна грешка на сървъра!')
          })
      }
      let $archiveBtns = $('[data-archive-id]')
      $archiveBtns.click(event => {
        event.stopPropagation()
        let id = $(event.target).data('archive-id')
        unarchiveOrder(id, event.target)
      })
    },
    archiveOrders: () => {
      let archiveOrder = (id, target) => {
        $.post(`/api/orders/${id}/archive`)
          .done(result => {
            miniToastr.success('Поръчката е архивирана.')
            $(target).parents('tr').fadeOut(300)
          })
          .error(er => {
            miniToastr.error('Възникна грешка на сървъра!')
          })
      }
      let $archiveBtns = $('[data-archive-id]')
      $archiveBtns.click(event => {
        event.stopPropagation()
        let id = $(event.target).data('archive-id')
        archiveOrder(id, event.target)
      })
    },
    insightsTableRowCallback: row => {
      let $priceTd = $(row).find('td:last-child')
      if (!$priceTd.text().includes('лв')) $priceTd.append(' лв.')
    }
  }

  $('table[data-table-ajax]').dataTable({
    ajax: $('table[data-table-ajax]').attr('data-table-ajax'),
    rowCallback: callbacks[$('table[data-table-ajax]').attr('data-table-row-callback')],
    drawCallback: callbacks[$('table[data-table-ajax]').attr('data-table-draw-callback')],
    footerCallback: callbacks[$('table[data-table-ajax]').attr('data-table-footer-callback')],
    pageLength: 100,
    order: $('table[data-table-ajax]').attr('data-table-sort') ? JSON.parse($('table[data-table-ajax]').attr('data-table-sort')) : ''
  })

  $('.date-picker').daterangepicker({
    format: 'DD-MM-YYYY',
    singleDatePicker: true,
    calender_style: 'picker_1',
    locale: {
      firstDay: 1
    }
  }, function (start, end, label) {
    if ($('.date-picker').attr('data-callback')) {
      let callback = $('.date-picker').attr('data-callback')
      window[callback](start)
    }
  })

  $('.select2').each((i, element) => {
    let $element = $(element)
    $element.select2({
      placeholder: $element.attr('data-placeholder'),
      allowClear: true,
      tags: $element.data('tags') ? true : false
    })
  })

  $('.select2-new-option').each((i, element) => {
    let $element = $(element)

    $element.parents('.modal').removeAttr('tabindex')
    $element.select2({
      placeholder: $element.attr('data-placeholder'),
      allowClear: true,
      tags: true
    })
  })

  $.ajax({
    url: '/api/users/sidebar-menu'
  })
  .done(sidebarMenu => {
    $('#sidebar-menu').append(sidebarMenu)
    setActiveNav()
  })
  .error(err => {
    miniToastr.init()
    miniToastr.error('Faild to load sidebar!')
  })

  let setActiveNav = () => {
    let pathname = window.location.pathname
    let routes = ['order', 'customer', 'translator', 'language', 'user', 'insight', 'not-paid-order', 'doc-type', 'not-paid-honorary', 'ministries', 'document']
    _.map(routes, route => {
      if (pathname.indexOf(route) !== -1) {
        if (pathname.includes('/not-paid-orders') && route === 'order') return
        
        $(`.side-menu li[data-route="${route}"]`).addClass('active')
      }
    })
  }

  $('a#menu_toggle').click(() => {
    localStorage['bodyClass'] = $('body').attr('class')
  })
})
