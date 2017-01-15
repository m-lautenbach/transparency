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

import {
  combineLatest,
  flatMap,
  fromEvent,
  of,
} from './fpRx/observable'

function getSocketDetails(socket) {
  return { socketId: socket.id, address: socket.handshake.address }
}

function app(ioServer) {
  
  let connection = null;
  r.connect({ host: 'localhost', port: 28015 }, function (err, conn) {
    if (err) throw err;
    
    r.db('transparency').tableCreate('events').run(conn, () => {
      const connections = fromEvent('connection', ioServer);

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

      const disconnections = flow(
        flatMap(socket => flow(
          fromEvent('disconnect'),
          concat(of(socket)),
          combineLatest(concat),
        )(socket))
      )(connections);

      disconnections.subscribe(([socket, msg]) => {
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
