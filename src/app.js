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
  fromEvent,
  of,
  scan,
  startWith,
  subscribe,
  withLatestFrom,
} from './fpRx/observable'

function getSocketDetails(socket) {
  return {socketId:socket.id, address:socket.handshake.address}
}

function accumulate(list, item) {
    return list.concat([item])
}

function app(ioServer) {
  var masterNS = ioServer.of('/master')

  var masterSockets = fromEvent('connection', masterNS)

  var connections = fromEvent('connection', ioServer)

  var disconnections = connections
    .flatMap(
      socket => flow(
        fromEvent('disconnect'),
        combineLatest(concat, of(socket)),
      )(socket)
    )

  var clients = connections
    .flatMap(
      socket => flow(
        fromEvent('client details'),
        combineLatest(concat, of(socket)),
      )(socket)
    )
    .map(
      ([clientDetails, socket]) =>
        assign(
          clientDetails,
          getSocketDetails(socket),
          {socket: socket}
        )
    )

  var allConnections = flow(
    startWith([]),
    scan(accumulate),
  )(clients)

  var allDisconnections = flow(
    startWith([]),
    scan(accumulate),
  )(disconnections)

  var connectedClients = combineLatest(
    (connections, disconnections) =>
      differenceWith(
          (client, [msg, socket]) => client.socketId === socket.id,
          connections,
          disconnections
      ),
    allDisconnections,
    allConnections,
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

  clients
    .map(omit('socket'))
    .subscribe(
      client =>
        masterNS.emit('client connected', client)
    )

  disconnections
    .subscribe(
      ([msg, socket]) => masterNS.emit('client disconnected', socket.id)
    )
}

export default app
