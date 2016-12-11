var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Rx = require('rxjs/Rx')
var {values, map, flow, set, assign, omit} = require('lodash/fp')

app.use(express.static('public'))
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/master', function(req, res){
  res.sendFile(__dirname + '/master.html');
});

getSocketDetails = function(socket) {
  return {socketId:socket.id, address:socket.handshake.address}
}

getConnectedClients = flow(
  values,
  map(getSocketDetails)
)

masterNS = io.of('/master')

var masterSockets = Rx.Observable
  .fromEvent(masterNS, 'connection')

var connections = Rx.Observable
  .fromEvent(io, 'connection')

var disconnects = connections
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

clients
  .map(client => omit('socket', client))
  .subscribe(
    client =>
      masterNS.emit('client connected', client)
  )

disconnects
  .subscribe(
    ([msg, socket]) => masterNS.emit('client disconnected', socket.id)
  )

masterSockets
  .subscribe(
    function(masterSocket) {
      masterSocket.emit('client list',
        map(
          function(client) {
            if(client.socketId === masterSocket.id.split('#')[1]) {
              return set('self', true, client)
            } else {
              return client
            }
          },
          getConnectedClients(io.sockets.connected)
))})

http.listen(3000, function(){
  console.log('listening on *:3000');
});
