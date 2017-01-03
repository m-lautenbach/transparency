import Rx from 'rxjs'
import {values, map, flow, set, assign, omit, differenceWith} from 'lodash/fp'
import {fromEvent, of} from './fpRx/observable'

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
      socket => fromEvent('disconnect', socket)
        .combineLatest(of(socket))
    )

  var clients = connections
    .flatMap(
      socket => fromEvent('client details', socket)
        .combineLatest(of(socket))
    )
    .map(
      ([clientDetails, socket]) =>
        assign(
          clientDetails,
          getSocketDetails(socket),
          {socket: socket}
        )
    )

  var allConnections = clients
    .startWith([])
    .scan(accumulate)

  var allDisconnections = disconnections
    .startWith([])
    .scan(accumulate)

  var connectedClients = Rx.Observable
      .combineLatest(
          allConnections,
          allDisconnections,
          (connections, disconnections) =>
              differenceWith(
                  (client, [msg, socket]) => client.socketId === socket.id,
                  connections,
                  disconnections
              )
      )

  masterSockets
    .withLatestFrom(connectedClients)
    .subscribe(
      function([masterSocket, connectedClients]) {
        masterSocket.emit('client list',
          map(
            (client) => omit('socket', client),
            connectedClients
  ))})

  clients
    .map(client => omit('socket', client))
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
