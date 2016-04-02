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
    // Observable returned will be converted into ConnectableObservable,
    // by invoking `publish` method
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

// Calling connect invokes `connect` method on all observables 
// returned by `process` functions
maxcon.connect();
```
