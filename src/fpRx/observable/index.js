import {Observable} from 'rxjs'
import {bind, curry, ary, flip, flow} from 'lodash/fp'

const bindTwo = curry((f, arg2, arg1) =>
  f(arg1, arg2)
)

const bindThree = curry((f, arg3, arg2, arg1) =>
  f(arg1, arg2, arg3)
)

const bindMethodOne = curry((methodName, arg, object) =>
  object[methodName](arg)
)

const bindMethodTwo = curry((methodName, arg2, arg1, object) =>
  object[methodName](arg1, arg2)
)

const combineLatest = bindThree(Observable.combineLatest)
const flatMap = bindMethodOne('flatMap')
const fromEvent = bindTwo(Observable.fromEvent)
const map = bindMethodOne('map')
const of = Observable.of
const scan = bindMethodOne('scan')
const startWith = bindMethodOne('startWith')
const subscribe = bindMethodOne('subscribe')
const withLatestFrom = bindMethodOne('withLatestFrom')

export {
  combineLatest,
  flatMap,
  fromEvent,
  map,
  of,
  scan,
  startWith,
  subscribe,
  withLatestFrom,
}
