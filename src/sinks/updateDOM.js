import { create, diff, patch, h } from 'virtual-dom'

let currentVDOM = h('div');
let rootNode = create(currentVDOM);
document.body.appendChild(rootNode)

function updateDOM(newVDOM) {
  const patches = diff(currentVDOM, newVDOM);
  rootNode = patch(rootNode, patches)
  currentVDOM = newVDOM
}

export default updateDOM
