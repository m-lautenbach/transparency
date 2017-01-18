import clientHandler from './pages/client'

let subscriber = handleUrl(window.location.pathname);

window.navTo = function (url) {
  subscriber.unsubscribe()
  subscriber = handleUrl(url)
}

function handleUrl(url) {
  switch (url) {
    default:
      return clientHandler()
  }
}
