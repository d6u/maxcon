'use strict';

const test = require('tape');
const td = require('testdouble');
const BehaviorSubject = require('rx').BehaviorSubject;
const Subject = require('rx').Subject;
const Observable = require('rx').Observable;
const runTask = require('../src/utils').runTask;

test('throw if task name is not found in config', function (t) {
  t.plan(1);

  const name = 'a';
  const tasks = {};
  const remaining = [];
  const running = {};

  function run() {
    runTask(name, tasks, remaining, running);
  }

  t.throws(run);
});

test('invoke defined "process"', function (t) {
  t.plan(1);

  const func = td.function();
  td.when(func(td.matchers.anything())).thenDo(() => new Subject());

  const name = 'a';
  const tasks = {
    a: {
      process: func,
    }
  };
  const remaining = [];
  const running = {};

  runTask(name, tasks, remaining, running);

  t.doesNotThrow(() => {
    td.verify(tasks.a.process({}));
  });
});

test('return result of "process"', function (t) {
  t.plan(1);

  const name = 'a';
  const tasks = {
    a: {
      process: () => new BehaviorSubject('object'),
    }
  };
  const remaining = [];
  const running = {};

  const result = runTask(name, tasks, remaining, running);

  result.subscribe((val) => t.equal(val, 'object'));

  result.connect();
});

test('walk though "upstreamTasks"', function (t) {
  t.plan(1);

  const funcA = td.function();
  const funcB = td.function();

  td.when(funcA(td.matchers.anything()))
    .thenDo(() => new BehaviorSubject('objectA'));
  td.when(funcB(td.matchers.anything()))
    .thenDo(() => new BehaviorSubject('objectB'));

  const name = 'c';
  const tasks = {
    a: {
      process: funcA,
    },
    b: {
      upstreamTasks: ['a'],
      process: funcB,
    },
    c: {
      upstreamTasks: ['a', 'b'],
      process: (upstream) => Observable.zip(upstream.a, upstream.b),
    },
  };
  const remaining = ['a', 'b'];
  const running = {};

  runTask(name, tasks, remaining, running);

  t.doesNotThrow(() => {
    td.verify(funcA(td.matchers.anything()), {times: 1});
    td.verify(funcB(td.matchers.anything()), {times: 1});
  });
});

test('link "upstreamTasks"', function (t) {
  t.plan(1);

  const name = 'c';
  const tasks = {
    a: {
      process: () => new BehaviorSubject('objectA'),
    },
    b: {
      upstreamTasks: ['a'],
      process: () => new BehaviorSubject('objectB'),
    },
    c: {
      upstreamTasks: ['a', 'b'],
      process: (upstream) => Observable.zip(upstream.a, upstream.b),
    },
  };
  const remaining = ['a', 'b'];
  const running = {};

  const result = runTask(name, tasks, remaining, running);

  result.subscribe((val) => t.deepEqual(val, ['objectA', 'objectB']));

  result.connect();
  Object.keys(running).forEach((key) => {
    running[key].connect();
  });
});
