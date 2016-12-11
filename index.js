var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Rx = require('rxjs/Rx')
var {values, map, flow, set} = require('lodash/fp')

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

Rx.Observable
  .fromEvent(masterNS, 'connection')
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
        )
      )
    }
  )

Rx.Observable
  .fromEvent(io, 'connection')
  .subscribe(
    function(socket) {
      masterNS.emit('client connected', getSocketDetails(socket))
      Rx.Observable
        .fromEvent(socket, 'disconnect')
        .subscribe(
          function() {
            masterNS.emit('client disconnected', socket.id)
          }
        )
    }
  )

http.listen(3000, function(){
  console.log('listening on *:3000');
});
