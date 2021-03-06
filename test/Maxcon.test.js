'use strict';

const test = require('tape');
const td = require('testdouble');
const Subject = require('rx').Subject;
const BehaviorSubject = require('rx').BehaviorSubject;
const Observable = require('rx').Observable;
const Maxcon = require('../lib').Maxcon;

test('"connect" invokes defined "process"', function (t) {
  t.plan(1);

  const func = td.function();
  td.when(func(td.matchers.anything())).thenDo(() => new Subject());

  const config = {
    a: {
      process: func,
    }
  };

  const maxcon = new Maxcon(config);

  maxcon.connect();

  t.doesNotThrow(() => {
    td.verify(config.a.process({}));
  });
});

test('"connect" connects observable returned by "process"', function (t) {
  t.plan(1);

  const config = {
    a: {
      process: () => Observable.create(() => t.pass())
    }
  };

  const maxcon = new Maxcon(config);

  maxcon.connect();
});

test('"connect" walks though "dependsOn" tasks', function (t) {
  t.plan(1);

  const funcA = td.function();
  const funcB = td.function();

  td.when(funcA(td.matchers.anything()))
    .thenDo(() => new BehaviorSubject('objectA'));
  td.when(funcB(td.matchers.anything()))
    .thenDo(() => new BehaviorSubject('objectB'));

  const config = {
    a: {
      process: funcA,
    },
    b: {
      dependsOn: ['a'],
      process: funcB,
    },
    c: {
      dependsOn: ['a', 'b'],
      process: (upstream) => Observable.zip(upstream.a, upstream.b),
    },
  };

  const maxcon = new Maxcon(config);

  maxcon.connect();

  t.doesNotThrow(() => {
    td.verify(funcA(td.matchers.anything()), {times: 1});
    td.verify(funcB(td.matchers.anything()), {times: 1});
  });
});

test('"connect" links "dependsOn" tasks', function (t) {
  t.plan(2);

  const config = {
    a: {
      process: () => new BehaviorSubject('objectA'),
    },
    b: {
      dependsOn: ['a'],
      process: () => new BehaviorSubject('objectB'),
    },
    c: {
      dependsOn: ['a', 'b'],
      process(upstream) {
        return Observable.zip(upstream.a, upstream.b, (a, b) => {
          t.equal(a, 'objectA');
          t.equal(b, 'objectB');
        });
      },
    },
  };

  const maxcon = new Maxcon(config);

  maxcon.connect();
});

test('"connect" only subscribes to tasks were not depended on', function (t) {
  t.plan(1);

  const funcA = td.function();
  const funcB = td.function();
  const funcC = td.function();
  const funcD = td.function();

  const config = {
    a: {
      process: () => new BehaviorSubject('objectA').doOnNext(funcA),
    },
    b: {
      process: () => new BehaviorSubject('objectB').doOnNext(funcB),
    },
    c: {
      dependsOn: ['a', 'b'],
      process: (upstream) => new BehaviorSubject('objectC').doOnNext(funcC),
    },
    d: {
      process: () => new BehaviorSubject('objectD').doOnNext(funcD),
    }
  };

  const maxcon = new Maxcon(config);

  maxcon.connect();

  t.doesNotThrow(() => {
    td.verify(funcA(td.matchers.anything()), {times: 0, ignoreExtraArgs: true});
    td.verify(funcB(td.matchers.anything()), {times: 0, ignoreExtraArgs: true});
    td.verify(funcC(td.matchers.anything()), {times: 1});
    td.verify(funcD(td.matchers.anything()), {times: 1});
  });
});

test('if provided a callback to "connect" and tasks throws, callback will be called with an error', function (t) {
  t.plan(1);

  const config = {
    a: {
      process: () => Observable.throw(new Error('test error')),
    }
  };

  const maxcon = new Maxcon(config);

  maxcon.connect((err) => {
    t.equal(err.message, 'test error');
  });
});

test('if provided a callback to "connect", callback will be called on completed', function (t) {
  t.plan(1);

  const config = {
    a: {
      process: () => Observable.just('some value'),
    }
  };

  const maxcon = new Maxcon(config);

  maxcon.connect((err) => {
    t.notOk(err);
  });
});
