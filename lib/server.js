import express from 'express'
import http from 'http'
import SocketIO from 'socket.io'
import Rx from 'rxjs'
import {values, map, flow, set, assign, omit, differenceWith} from 'lodash/fp'

const app = express()
const httpServer = http.Server(app)
const ioServer = new SocketIO(httpServer)

app.use(express.static('public'))
app.get('/*', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

function getSocketDetails(socket) {
  return {socketId:socket.id, address:socket.handshake.address}
}

var getConnectedClients = flow(
  values,
  map(getSocketDetails)
)

function accumulate(list, item) {
    return list.concat([item])
}

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

httpServer.listen(3000, function(){
  console.log('listening on *:3000');
});
