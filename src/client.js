import masterHandler from './pages/master'
import clientHandler from './pages/client'

let subscriber = handleUrl(window.location.pathname);

window.navTo = function (url) {
  subscriber.unsubscribe()
  subscriber = handleUrl(url)
}

function handleUrl(url) {
  switch (url) {
    case '/master':
      return masterHandler()
    default:
      return clientHandler()
  }
}
