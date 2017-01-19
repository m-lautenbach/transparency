import {
  concat,
  find,
  get,
  identity,
  takeRightWhile,
  last,
  isEmpty,
  join,
} from 'lodash/fp'
import io from 'socket.io-client'
import { h } from 'virtual-dom'
import bowser from 'bowser'

import { updateDOM } from '../sinks'
import * as Rx from 'rxjs'

function handler() {
  const socket = io({ 'forceNew': true });
  const clientDetails = {
    browser: {
      name: bowser.name,
      version: bowser.version,
      capabilities: find((flag) => bowser[flag], ['a', 'c', 'x']),
    },
    os: find(
      (flag) => bowser[flag],
      [
        'mac',
        'windows',
        'windowsphone',
        'linux',
        'chromeos',
        'android',
        'ios',
        'blackberry',
        'firefoxos',
        'webos',
        'bada',
        'tizen',
        'sailfish'
      ],
    ),
  };
  socket.emit('client details', clientDetails)

  const connects = Rx.Observable
    .fromEvent(socket, 'connect')
    .map(() => ({
      type: 'socket',
      status: 'connected',
    }))

  const disconnects = Rx.Observable
    .fromEvent(socket, 'disconnect')
    .map(() => ({
      type: 'socket',
      status: 'disconnected',
    }))

  const keypresses = Rx.Observable
    .fromEvent(document, 'keydown')

  const undoPressed = keypresses
    .filter(event => event.metaKey && event.key === 'z')
    .map(() => ({type: 'undoEvent'}))

  const inputChars = keypresses
    .filter(event => !event.altKey && !event.metaKey && !event.ctrlKey)
    .map(get('key'))
    .filter(key => key.length === 1)

  const input = inputChars
    .merge(undoPressed)
    .merge(
      inputChars
        .auditTime(1000)
        .map(() => ({type: 'undoMarker'}))
    )
    .scan(
      (acc, event) => {
        if(event.type === 'undoMarker') {
          return isEmpty(last(acc)) && acc || acc.concat([[]])
        }
        if(event.type === 'undoEvent') {
          return acc.slice(0, isEmpty(last(acc)) && -2 || -1).concat([[]])
        }
        return acc.slice(0, -1).concat(
          acc.slice(-1).pop().concat(event)
        )
      },
      [[]],
    )
    .map(join(''))
    .distinctUntilChanged()

  Rx.Observable
    .fromEvent(document, 'click')
    // .subscribe(event => console.log(event.target))

  const connectionState = Rx.Observable
    .merge(connects, disconnects)
    .startWith({ type: 'socket', status: 'connecting' })

  return Rx.Observable
    .combineLatest(
      connectionState,
      input.startWith(''),
    )
    .subscribe(
      ([connectionState, input]) => updateDOM(renderVDOM(connectionState, input))
    )
}

function renderVDOM(connectionState, input) {
  return h('div',
    [
      h('ul', { className: 'nav nav-tabs' }, [
          h('li', h('a', { href: "javascript:navTo('/master');" }, 'Master')),
          h('li', { className: 'active' }, h('a', { href: "javascript:;" }, 'Client')),
        ]
      ),
      h('div', input),
      h('i', { className: `fa fa-circle connection-state ${connectionState.status}` }),
    ]
  )
}

export default handler
