import {
  assign,
  concat,
  flow,
  get,
  map,
  omit,
} from 'lodash/fp'
import {
  combineLatest,
  flatMap,
  fromEvent,
  map as rxMap,
  of,
  subscribe,
  toList,
  toCurrentList,
  withLatestFrom,
} from './fpRx/observable'

function getSocketDetails(socket) {
  return { id: socket.id, address: socket.handshake.address }
}

function app(ioServer) {
  const masterNS = ioServer.of('/master');
  
  const masterSockets = fromEvent('connection', masterNS);
  
  const connections = fromEvent('connection', ioServer);
  
  const disconnections = flow(
    flatMap(socket => flow(
      fromEvent('disconnect'),
      concat(of(socket)),
      combineLatest(concat),
    )(socket))
  )(connections);
  
  const clients = flow(
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
          { socket: socket }
        )
    )
  )(connections);
  
  const allConnections = toList(clients);
  const allDisconnections = toList(disconnections);
  
  const connectedClients = toCurrentList(
    'id',
    of([]),
    allConnections,
    rxMap(map(get('0.id')), allDisconnections),
  );
  
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
