import {Observable} from 'rxjs'
import {curry, ary, flip, flow} from 'lodash/fp'

const bindTwo = curry((f, arg2, arg1) =>
  f(arg1, arg2)
)

const bindThree = curry((f, arg3, arg2, arg1) =>
  f(arg1, arg2, arg3)
)

const of = Observable.of
const fromEvent = bindTwo(Observable.fromEvent)
const combineLatest = bindThree(Observable.combineLatest)

export {
  fromEvent,
  of,
  combineLatest,
}
