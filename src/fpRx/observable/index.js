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

const of = Observable.of
const startWith = bindMethodOne('startWith')
const scan = bindMethodOne('scan')
const fromEvent = bindTwo(Observable.fromEvent)
const combineLatest = bindThree(Observable.combineLatest)

export {
  combineLatest,
  fromEvent,
  of,
  scan,
  startWith,
}
