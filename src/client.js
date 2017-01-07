import {
  differenceWith,
  find,
  flow,
  map,
  reject,
} from 'lodash'
import Rx from 'rxjs'
import io from 'socket.io-client'
import {create, diff, patch, h} from 'virtual-dom'
import bowser from 'bowser'
import {
  combineLatest,
  fromEvent,
  of,
  scan,
  startWith,
  toList,
} from './fpRx/observable'

if(window.location.pathname === '/master') {
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

  var currentListVDOM = renderMaster([])
  var rootNode = create(currentListVDOM)
  document.body.appendChild(rootNode)

  Rx.Observable
    .combineLatest(
      initialList,
      connections,
      disconnections,
      (initialList, connections, disconnections) =>
        differenceWith(
          initialList.concat(connections),
          disconnections,
          (connection, disconnection) => connection.id === disconnection
        )
    )
    .subscribe(
      (connectedClients) => updateDOM(renderMaster(connectedClients))
    )
} else {
  var socket = io();
  var clientDetails = {
    browser: {
      name: bowser.name,
      version: bowser.version,
      capabilities: find(['a', 'c', 'x'], (flag) => bowser[flag]),
    },
    os: find(['mac', 'windows', 'windowsphone', 'linux', 'chromeos', 'android', 'ios', 'blackberry', 'firefoxos', 'webos', 'bada', 'tizen', 'sailfish'],
      (flag) => bowser[flag]
    ),
  }
  socket.emit('client details', clientDetails)
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

function updateDOM(newVDOM) {
  var patches = diff(currentListVDOM, newVDOM)
  rootNode = patch(rootNode, patches)
  currentListVDOM = newVDOM
}

function renderMaster(clients) {
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
