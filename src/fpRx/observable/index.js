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
const combineLatest = curry(
  (selector, observableSource, observableTarget) =>
    Observable.combineLatest([observableTarget, observableSource], selector)
)

export {
  fromEvent,
  of,
  combineLatest,
}
