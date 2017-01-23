import io from 'socket.io-client'
import { h } from 'virtual-dom'
import {
  get,
  flow,
  map,
  flatten,
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

  const inputs = [
    { id: 'input_a', title: 'Input A', value: '' },
    { id: 'input_b', title: 'Input B', value: '' },
    { id: 'input_c', title: 'Input C', value: '' },
  ]

  Rx.Observable
    .fromEvent(document, 'input')
    .subscribe(({ target: { id, value } }) => console.log(`input[${id}]: ${value}`))

  const focusOut = Rx.Observable
    .fromEvent(document, 'focusout')

  const focusIn = Rx.Observable
    .fromEvent(document, 'focusin')

  Rx.Observable.merge(
    focusOut.map(() => null),
    focusIn.map(get('target.id')),
  )
    .startWith(null)
    .subscribe(focus =>
      console.log(focus)
    )

  return Rx.Observable
    .combineLatest(
      connectionState,
      Rx.Observable.of(inputs)
    )
    .subscribe(flow(
      renderVDOM,
      updateDOM,
    ))
}

function renderVDOM([connectionState, inputs]) {
  return h('div',
    [
      h('i', { className: `fa fa-circle connection-state ${connectionState}` }),
      h('div', { className: 'form-group' }, flow(
        map(({ id, title, value }) => [
          h('label', { for: id }, title),
          h('input', { type: 'text', className: 'form-control', id, value }),
        ]),
        flatten,
      )(inputs))
    ]
  )
}

export default handler
