if(window.location.pathname === '/master') {
  var vD = virtualDom

  var socket = io('/master')

  var initialList = Rx.Observable
    .fromEvent(socket, 'client list')
    .map(list => _.reject(list, (client) => client.self))

  var connections = Rx.Observable
    .fromEvent(socket, 'client connected')
    .scan(accumulate, [])
    .merge(
      Rx.Observable.of([])
    )

  var disconnections = Rx.Observable
    .fromEvent(socket, 'client disconnected')
    .scan(accumulate, [])
    .merge(
      Rx.Observable.of([])
    )

  var currentListVDOM = render([])
  var rootNode = vD.create(currentListVDOM)
  document.body.appendChild(rootNode)

  Rx.Observable
    .combineLatest(
      initialList,
      connections,
      disconnections,
      function(initialList, connections, disconnections) {
        return _.differenceWith(
          initialList.concat(connections),
          disconnections,
          function(connection, disconnection) {
            return connection.socketId === disconnection
          }
        )
      }
    )
    .subscribe(
      function(connectedClients) {
        var newListVDOM = render(connectedClients)
        var patches = vD.diff(currentListVDOM, newListVDOM)
        rootNode = vD.patch(rootNode, patches)
        currentListVDOM = newListVDOM
      }
    )
} else {
  var socket = io();
  var clientDetails = {
    browser: {
      name: bowser.name,
      version: bowser.version,
      capabilities: _.find(['a', 'c', 'x'], (flag) => bowser[flag]),
    },
    os: _.find(['mac', 'windows', 'windowsphone', 'linux', 'chromeos', 'android', 'ios', 'blackberry', 'firefoxos', 'webos', 'bada', 'tizen', 'sailfish'],
      (flag) => bowser[flag]
    ),
  }
  socket.emit('client details', clientDetails)
}

function accumulate(list, item) {
  return list.concat([item])
}

function getIcon(tag) {
  iconName = undefined
  switch (tag) {
    case 'mac':
      iconName = 'apple'
      break
    default:
      iconName = tag.toLowerCase()
  }
  return vD.h('i', {className: `fa fa-${iconName}`})
}

function render(clients) {
  return vD.h('table', {className: 'client-list'},
    [
      vD.h('caption', {className: 'client-list__header'}, 'connected clients')
    ].concat(
      _.map(
        clients,
        client =>
          vD.h('tr', {className: 'client-list__entry client-row'}, [
            vD.h('td', {className: 'client-row__socket-id'}, client.socketId),
            vD.h('td', {className: 'client-row__address'}, client.address),
          vD.h('td', {className: 'client-row__os-icon'}, getIcon(client.os)),
          vD.h('td',
            {className: 'client-row__browser-icon'},
            getIcon(client.browser.name)
          ),
          vD.h('td', {className: 'client-row__browser-version'}, client.browser.version),
          vD.h('td', {className: 'client-row__capabilities'}, client.browser.capabilities)
        ])
      )
    )
  )
}
