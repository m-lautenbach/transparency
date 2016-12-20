import express from 'express'
import http from 'http'
import SocketIO from 'socket.io'
import application from './app'

const app = express()
const httpServer = http.Server(app)

application(new SocketIO(httpServer))

app.use(express.static('public'))
app.get('/*', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

httpServer.listen(3000, function(){
  console.log('listening on *:3000');
});
