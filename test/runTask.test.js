'use strict';

const test = require('tape');
const td = require('testdouble');
const BehaviorSubject = require('rx').BehaviorSubject;
const Subject = require('rx').Subject;
const Observable = require('rx').Observable;
const runTask = require('../src/utils').runTask;

test('throw if there is circular dependency', function (t) {
  t.plan(1);

  const tasks = {};
  const name = 'a';
  const remaining = [];
  const sorted = ['a'];
  const running = {};
  const parents = [];

  function run() {
    runTask(tasks, name, remaining, sorted, running, parents);
  }

  t.throws(run);
});

test('throw if task name is not found in config', function (t) {
  t.plan(1);

  const tasks = {};
  const name = 'a';
  const remaining = [];
  const sorted = [];
  const running = {};
  const parents = [];

  function run() {
    runTask(tasks, name, remaining, sorted, running, parents);
  }

  t.throws(run);
});

test('invoke defined "process"', function (t) {
  t.plan(1);

  const func = td.function();
  td.when(func(td.matchers.anything())).thenDo(() => new Subject());

  const tasks = {
    a: {
      process: func,
    }
  };
  const name = 'a';
  const remaining = [];
  const sorted = [];
  const running = {};
  const parents = [];

  runTask(tasks, name, remaining, sorted, running, parents);

  t.doesNotThrow(() => {
    td.verify(tasks.a.process({}));
  });
});

test('return result of "process"', function (t) {
  t.plan(1);

  const tasks = {
    a: {
      process: () => new BehaviorSubject('object'),
    }
  };
  const name = 'a';
  const remaining = [];
  const sorted = [];
  const running = {};
  const parents = [];

  runTask(tasks, name, remaining, sorted, running, parents);

  running.a.subscribe((val) => t.equal(val, 'object'));

  running.a.connect();
});

test('walk though "upstreamTasks"', function (t) {
  t.plan(1);

  const funcA = td.function();
  const funcB = td.function();

  td.when(funcA(td.matchers.anything()))
    .thenDo(() => new BehaviorSubject('objectA'));
  td.when(funcB(td.matchers.anything()))
    .thenDo(() => new BehaviorSubject('objectB'));

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
  const name = 'c';
  const remaining = ['a', 'b'];
  const sorted = [];
  const running = {};
  const parents = [];

  runTask(tasks, name, remaining, sorted, running, parents);

  t.doesNotThrow(() => {
    td.verify(funcA(td.matchers.anything()), {times: 1});
    td.verify(funcB(td.matchers.anything()), {times: 1});
  });
});

test('link "upstreamTasks"', function (t) {
  t.plan(1);

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
  const name = 'c';
  const remaining = ['a', 'b'];
  const sorted = [];
  const running = {};
  const parents = [];

  runTask(tasks, name, remaining, sorted, running, parents);

  running.c.subscribe((val) => t.deepEqual(val, ['objectA', 'objectB']));

  sorted.reverse().forEach((name) => running[name].connect());
});
