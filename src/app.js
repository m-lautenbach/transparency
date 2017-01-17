import {
  assign,
  concat,
  flow,
  get,
  map,
  merge,
  omit,
} from 'lodash/fp'
import r from 'rethinkdb'
import * as Rx from 'rxjs'

function getSocketDetails(socket) {
  return { socketId: socket.id, address: socket.handshake.address }
}

function app(ioServer) {
  
  let connection = null;
  r.connect({ host: 'localhost', port: 28015 }, function (err, conn) {
    if (err) throw err;

    r.db('transparency').tableCreate('events').run(conn, () => {
      const connections = Rx.Observable.fromEvent(ioServer, 'connection');

      connections.subscribe((socket) => {
        r.db('transparency')
          .table('events')
          .insert(
            merge(
              getSocketDetails(socket),
              {type: 'connected'},
            )
          )
          .run(conn, (err, data) => {
            if(err) throw err
            if(data.errors > 0) throw data.first_error
          })
      })

      const disconnections =
        connections
          .flatMap(socket =>
            Rx.Observable.combineLatest(
              Rx.Observable
                .fromEvent(socket, 'disconnect'),
              Rx.Observable.of(socket),
            )
          )

      disconnections.subscribe(([msg, socket]) => {
        r.db('transparency')
          .table('events')
          .insert(
            merge(
              getSocketDetails(socket),
              {
                type: 'disconnected',
                msg,
              },
            )
          )
          .run(conn, (err, data) => {
            if(err) throw err
            if(data.errors > 0) throw data.first_error
          })
      })
    })
  })
}

export default app
