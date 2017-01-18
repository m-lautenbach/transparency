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
    .map(() => 'undo')

  const input = keypresses
    .filter(event => !event.altKey && !event.metaKey && !event.ctrlKey)
    .map(get('key'))
    .filter(key => key.length === 1)
    .startWith('')
    .merge(undoPressed)
    .scan(
      (acc, event) => event !== 'undo' && acc.concat(event) || ''
    )

  Rx.Observable
    .fromEvent(document, 'click')
    .subscribe(event => console.log(event.target))

  const connectionState = Rx.Observable
    .merge(connects, disconnects)
    .startWith({type: 'socket', status: 'connecting'})
  
  return Rx.Observable
    .combineLatest(
      connectionState,
      input,
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
