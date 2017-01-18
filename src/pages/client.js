import {
  find,
  flow,
} from 'lodash'
import { concat, get } from 'lodash/fp'
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
      capabilities: find(['a', 'c', 'x'], (flag) => bowser[flag]),
    },
    os: find([
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
      (flag) => bowser[flag]
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

  const undoStack = inputChars
    .auditTime(1000)
    .startWith('')
    .map(value => ({ type: 'undoValue', value }))
    .merge(undoPressed)
    .scan(({ stack, undo }, event) => ({
        stack: event.type === 'undoValue' && stack.concat(event.value) ||
          event.type === 'undoEvent' && stack.slice(0, -1),
        undo: (event.type == 'undoEvent' && stack.slice(-1) || [null]).pop()
      }),
      { stack: [], undo: null }
    )

  const undos = undoStack
    .filter(stackElement => stackElement.undo !== null)

  const input = undos
    .merge(inputChars)
    .scan((acc, event) =>
      event.undo || acc.concat(event) || ''
    )

  undoStack
    .subscribe(undo => console.log(undo))

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
