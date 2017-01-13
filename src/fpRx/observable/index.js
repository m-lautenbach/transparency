import { Observable } from 'rxjs';
import {
    curry,
    differenceWith,
    flow,
} from 'lodash/fp';

const bindTwo = curry((f, arg2, arg1) =>
    f(arg1, arg2),
);

const bindMethodOne = curry((methodName, arg, object) =>
    object[methodName](arg),
);

const combineLatest = bindTwo(Observable.combineLatest);
const flatMap = bindMethodOne('flatMap');
const fromEvent = bindTwo(Observable.fromEvent);
const map = bindMethodOne('map');
const merge = observables => Observable.merge(...observables);
const of = Observable.of;
const scan = bindMethodOne('scan');
const startWith = bindMethodOne('startWith');
const subscribe = bindMethodOne('subscribe');
const withLatestFrom = bindMethodOne('withLatestFrom');

const toList = flow(
    startWith([]),
    scan((list, item) => list.concat([item])),
);

const toCurrentList = curry(
    (idKey, initialListObservable, addObservable, removeObservable) => combineLatest(
        (initial, adds, removes) =>
            differenceWith(
                (item, idToRemove) => item[idKey] === idToRemove,
                initial.concat(adds),
                removes,
            )
        ,
        [
            initialListObservable,
            addObservable,
            removeObservable,
        ],
    ),
);

export {
    combineLatest,
    flatMap,
    fromEvent,
    map,
    merge,
    of,
    scan,
    startWith,
    subscribe,
    toCurrentList,
    toList,
    withLatestFrom,
};
