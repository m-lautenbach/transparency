import {Observable} from 'rxjs'
import {curry, ary, flip, flow} from 'lodash/fp'

const fromEvent =
  flow(
    ary(2),
    flip,
    curry,
  )(Observable.fromEvent)

const of = Observable.of

export {
  fromEvent,
  of,
}
