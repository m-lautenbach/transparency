import {create, diff, patch, h} from 'virtual-dom'

var currentVDOM = h('div')
var rootNode = create(currentVDOM)
document.body.appendChild(rootNode)

function updateDOM(newVDOM) {
  var patches = diff(currentVDOM, newVDOM)
  rootNode = patch(rootNode, patches)
  currentVDOM = newVDOM
}

export default updateDOM
