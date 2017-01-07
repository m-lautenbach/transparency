import {
  assign,
  concat,
  differenceWith,
  flow,
  map,
  omit,
  set,
  tap,
  values,
} from 'lodash/fp'
import {
  combineLatest,
  flatMap,
  fromEvent,
  map as rxMap,
  of,
  scan,
  startWith,
  subscribe,
  toList,
  withLatestFrom,
} from './fpRx/observable'

function getSocketDetails(socket) {
  return {id:socket.id, address:socket.handshake.address}
}

function app(ioServer) {
  var masterNS = ioServer.of('/master')

  var masterSockets = fromEvent('connection', masterNS)

  var connections = fromEvent('connection', ioServer)

  var disconnections = flow(
    flatMap(socket => flow(
      fromEvent('disconnect'),
      concat(of(socket)),
      combineLatest(concat),
    )(socket))
  )(connections)

  var clients = flow(
    flatMap(
      socket => flow(
        fromEvent('client details'),
        concat(of(socket)),
        combineLatest(concat),
      )(socket)
    ),
    rxMap(
      ([socket, clientDetails]) =>
        assign(
          clientDetails,
          getSocketDetails(socket),
          {socket: socket}
        )
    )
  )(connections)

  var allConnections = toList(clients)
  var allDisconnections = toList(disconnections)

  var connectedClients = combineLatest(
    (connections, disconnections) =>
      differenceWith(
          (client, [socket, msg]) => client.id === socket.id,
          disconnections,
          connections,
      ),
    [
      allDisconnections,
      allConnections,
    ]
  )

  flow(
    withLatestFrom(connectedClients),
    subscribe(
      ([masterSocket, connectedClients]) =>
        masterSocket.emit('client list',
          map(
            omit('socket'),
            connectedClients,
          )
        )
    )
  )(masterSockets)

  flow(
    rxMap(omit('socket')),
    subscribe(
      client => masterNS.emit('client connected', client)
    )
  )(clients)

  subscribe(
    ([socket, msg]) => masterNS.emit('client disconnected', socket.id),
    disconnections
  )
}

export default app
