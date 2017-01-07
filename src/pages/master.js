import {
  flow,
  map,
  reject,
} from 'lodash'
import io from 'socket.io-client'
import {h} from 'virtual-dom'

import {
  fromEvent,
  subscribe,
  toCurrentList,
  toList,
} from '../fpRx/observable'
import {render} from '../sinks'

function handler() {
  var socket = io('/master')

  var initialList = flow(
    fromEvent('client list'),
    map(list => reject(list, (client) => client.self)),
  )(socket)

  var connections = flow(
    fromEvent('client connected'),
    toList,
  )(socket)

  var disconnections = flow(
    fromEvent('client disconnected'),
    toList,
  )(socket)

  const updateDOM = render(renderVDOM([]))

  subscribe(
    (connectedClients) => updateDOM(renderVDOM(connectedClients)),
    toCurrentList('id', initialList, connections, disconnections),
  )
}

function renderVDOM(clients) {
  return h('div', {className: 'row'},
    h('div', {className: 'col-md-4'},
      h('div', {className: 'panel panel-default'},
        h('div', {className: 'panel-body'},
          h('table', {className: 'client-list table table-striped table-hover table-condensed'},
            [
              h('caption', {className: 'client-list__header'}, 'connected clients'),
              h('tbody', {}, map(
                clients,
                client =>
                  h('tr', {className: 'client-list__entry client-row'}, [
                    h('td', {className: 'client-row__socket-id'}, client.id),
                    h('td', {className: 'client-row__address'}, client.address),
                    h('td', {className: 'client-row__os-icon'}, getIcon(client.os)),
                    h('td',
                      {className: 'client-row__browser-icon'},
                      getIcon(client.browser.name)
                    ),
                    h('td', {className: 'client-row__browser-version'}, client.browser.version),
                    h('td', {className: 'client-row__capabilities'}, client.browser.capabilities),
                  ])
              ))
            ]
          )
        )
      )
    )
  )
}

function getIcon(tag) {
  var iconName = undefined
  switch (tag) {
    case 'mac':
      iconName = 'apple'
      break
    default:
      iconName = tag.toLowerCase()
  }
  return h('i', {className: `fa fa-${iconName}`})
}

export default handler
