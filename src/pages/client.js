import io from 'socket.io-client'
import { h } from 'virtual-dom'
import {
  flatten,
  flow,
  get,
  map,
  zip,
  tap,
} from 'lodash/fp'

import { updateDOM } from '../sinks'
import Rx from 'rxjs'

function handler() {
  const socket = io();

  const connects = Rx.Observable
    .fromEvent(socket, 'connect')
    .map(() => 'connected')

  const disconnects = Rx.Observable
    .fromEvent(socket, 'disconnect')
    .map(() => 'disconnected')

  const connectionState = Rx.Observable
    .merge(connects, disconnects)
    .startWith('connecting')

  return Rx.Observable
    .combineLatest(
      connectionState,
      (connectionState) => {
        return { connectionState }
      }
    )
    .subscribe(flow(
      renderVDOM,
      updateDOM,
    ))
}

function renderVDOM({ connectionState }) {
  return h('div',
    [
      h('i', { className: `fa fa-circle connection-state ${connectionState}` }),
    ]
  )
}

export default handler
