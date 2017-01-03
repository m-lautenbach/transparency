import {Observable} from 'rxjs'
import {curry, ary, flip, flow} from 'lodash/fp'

const bindTwo =
  flow(
    ary(2),
    flip,
    curry,
  )

const of = Observable.of
const fromEvent = bindTwo(Observable.fromEvent)
const combineLatest = bindTwo(Observable.combineLatest)

export {
  fromEvent,
  of,
  combineLatest,
}
