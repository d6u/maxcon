# MAXCON

Run series of operations in a dependency driven, maximumly concurrent way.

[![npm version](https://badge.fury.io/js/maxcon.svg)](https://badge.fury.io/js/maxcon)

## Install

```sh
npm install --save maxcon
```

## Usage

```js
const Rx = require('rx');

const config = {
  a: {
    process: () => Rx.Observable.just('value a'),
  },
  b: {
    process: () => Rx.Observable.just('value b'),
  },
  c: {
    // `process` will be called with observables returned from task a and b
    dependsOn: ['a', 'b'],
    process: (upstream) => Rx.Observable.zip(upstream.a, upstream.b),
  },
};

const maxcon = new Maxcon(config);

// Calling `connect` will do three things:
// 1. invoke all `process` functions once.
// 2. invoke `share` method of observables returned from `process` functions.
// 3. observables that are not depended on (no downstream) will be merged
//    and converted to a ConnectableObservable (by calling `publish`) and
//    then connected (by calling `connect`).
maxcon.connect();
```
