import io from 'socket.io-client'
import { h } from 'virtual-dom'
import {
  isEqual,
  flatten,
  flow,
  get,
  map,
  zip,
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

  const inputData = [
    { id: 'input_a', title: 'Input A' },
    { id: 'input_b', title: 'Input B' },
    { id: 'input_c', title: 'Input C' },
  ]

  const targetIdEqual = id => flow(
    get('target.id'),
    isEqual(id),
  )

  const currentFocus = Rx.Observable.merge(
    Rx.Observable
      .fromEvent(document, 'focusout')
      .map(() => null),
    Rx.Observable
      .fromEvent(document, 'focusin')
      .map(get('target.id')),
  )
    .startWith(null)

  const inputs = Rx.Observable.combineLatest(
    [Rx.Observable.of(inputData)].concat(
      inputData
        .map(get('id'))
        .map(id =>
          Rx.Observable
            .fromEvent(document, 'input')
            .filter(targetIdEqual(id))
            .map(get('target.value'))
            .startWith(''),
        )
    )
  ).map(([inputs, value_a, value_b, value_c]) =>
    zip(
      inputs,
      [value_a, value_b, value_c],
    ).map(([input, value]) => {
      return {...input, value}
    })
  )

  return Rx.Observable
    .combineLatest(
      connectionState,
      inputs,
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
