import {
  find,
  flow,
} from 'lodash'
import io from 'socket.io-client'
import {h} from 'virtual-dom'
import bowser from 'bowser'

import {
  fromEvent,
  map as rxMap,
  merge,
  subscribe,
} from '../fpRx/observable'
import {updateDOM} from '../sinks'

function handler() {
  updateDOM(renderVDOM('connecting'))

  var socket = io({'forceNew':true});
  var clientDetails = {
    browser: {
      name: bowser.name,
      version: bowser.version,
      capabilities: find(['a', 'c', 'x'], (flag) => bowser[flag]),
    },
    os: find(['mac', 'windows', 'windowsphone', 'linux', 'chromeos', 'android', 'ios', 'blackberry', 'firefoxos', 'webos', 'bada', 'tizen', 'sailfish'],
      (flag) => bowser[flag]
    ),
  }
  socket.emit('client details', clientDetails)

  var connects = flow(
    fromEvent('connect'),
    rxMap(() => 'connected'),
  )(socket)
  var disconnects = flow(
    fromEvent('disconnect'),
    rxMap(() => 'disconnected'),
  )(socket)

  return subscribe(
    (connectionState) => updateDOM(renderVDOM(connectionState)),
    merge([
      connects,
      disconnects,
    ]),
  )
}

function renderVDOM(connectionState) {
  return h('div',
    [
      h('ul', {className: 'nav nav-tabs'}, [
          h('li', h('a', {href: "javascript:navTo('/master');"}, 'Master')),
          h('li', {className: 'active'}, h('a', {href: "javascript:;"}, 'Client')),
        ]
      ),
      h('i', {className: `fa fa-circle connection-state ${connectionState}`}),
    ]
  )
}

export default handler
