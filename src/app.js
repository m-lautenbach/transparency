import Rx from 'rxjs'
import {values, map, flow, set, assign, omit, differenceWith} from 'lodash/fp'

function getSocketDetails(socket) {
  return {socketId:socket.id, address:socket.handshake.address}
}

function accumulate(list, item) {
    return list.concat([item])
}

function app(ioServer) {
  var masterNS = ioServer.of('/master')

  var masterSockets = Rx.Observable
    .fromEvent(masterNS, 'connection')

  var connections = Rx.Observable
    .fromEvent(ioServer, 'connection')

  var disconnections = connections
    .map(
      socket => Rx.Observable
        .fromEvent(socket, 'disconnect')
        .combineLatest(Rx.Observable.of(socket))
    )
    .mergeAll()

  var clients = connections
    .map(
      socket => Rx.Observable
        .fromEvent(socket, 'client details')
        .combineLatest(
          Rx.Observable.of(socket)
        )
    )
    .mergeAll()
    .map(
      ([clientDetails, socket]) =>
        assign(
          clientDetails,
          getSocketDetails(socket),
          {socket: socket}
        )
    )

  var allConnections = clients
    .scan(accumulate, [])
    .merge(
        Rx.Observable.of([])
    )

  var allDisconnections = disconnections
    .scan(accumulate, [])
    .merge(
        Rx.Observable.of([])
    )

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
