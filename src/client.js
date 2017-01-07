import masterHandler from './pages/master'
import clientHandler from './pages/client'

if(window.location.pathname === '/master') {
  masterHandler()
} else {
  clientHandler()
}

