import io from 'socket.io-client'
import { h } from 'virtual-dom'

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
    )
    .subscribe(
      ([connectionState]) => updateDOM(renderVDOM(connectionState))
    )
}

function renderVDOM(connectionState) {
  return h('div',
    [
      h('i', { className: `fa fa-circle connection-state ${connectionState}` }),
      h('div', { className: 'form-group' }, [
        h('label', { for: 'test-input' }, 'Test input'),
        h('input', { type: 'text', className: 'form-control', id: 'test-input' }),
      ]),
    ]
  )
}

export default handler
