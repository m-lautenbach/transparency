import {
  find,
  flow,
} from 'lodash'
import { concat, get } from 'lodash/fp'
import io from 'socket.io-client'
import { h } from 'virtual-dom'
import bowser from 'bowser'

import {
  fromEvent,
  map as rxMap,
  merge,
  subscribe,
} from '../fpRx/observable'
import { updateDOM } from '../sinks'
import { combineLatest, map } from '../fpRx/observable/index'

function handler() {
  updateDOM(renderVDOM({type: 'socket', status: 'connecting'}))
  
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
  
  const connects = flow(
    fromEvent('connect'),
    rxMap(() => { return {
      type: 'socket',
      status: 'connected',
    }}),
  )(socket);
  const disconnects = flow(
    fromEvent('disconnect'),
    rxMap(() => { return {
      type: 'socket',
      status: 'disconnected',
    }}),
  )(socket);

  const keypresses = flow(
    fromEvent('keypress'),
    map(get('key')),
  )(document)
    .scan(
      (acc, key) => acc.concat(key)
    )

  const connectionState = merge([connects, disconnects])
  
  return subscribe(
    ([connectionState, keypresses]) => updateDOM(renderVDOM(connectionState, keypresses)),
    combineLatest(concat, [
      connectionState,
      keypresses,
    ]),
  )
}

function renderVDOM(connectionState, keypresses) {
  return h('div',
    [
      h('ul', { className: 'nav nav-tabs' }, [
          h('li', h('a', { href: "javascript:navTo('/master');" }, 'Master')),
          h('li', { className: 'active' }, h('a', { href: "javascript:;" }, 'Client')),
        ]
      ),
      h('div', keypresses),
      h('i', { className: `fa fa-circle connection-state ${connectionState.status}` }),
    ]
  )
}

export default handler
