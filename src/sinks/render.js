import {create, diff, patch, h} from 'virtual-dom'

function init(initalVDOM) {
  var currentVDOM = initalVDOM
  var rootNode = create(currentVDOM)
  document.body.appendChild(rootNode)

  return function updateDOM(newVDOM) {
    var patches = diff(currentVDOM, newVDOM)
    rootNode = patch(rootNode, patches)
    currentVDOM = newVDOM
  }
}

export default init
