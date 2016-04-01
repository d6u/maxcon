'use strict';

const test = require('tape');
const removeTaskName = require('../src/utils').removeTaskName;

test('remove name from an array', function (t) {
  t.plan(1);

  const name = 'a';
  const arr = ['a', 'b', 'c'];

  removeTaskName(name, arr);

  t.deepEqual(arr, ['b', 'c']);
});

test('throw if name is not in the array', function (t) {
  t.plan(1);

  const name = 'd';
  const arr = ['a', 'b', 'c'];

  function run() {
    removeTaskName(name, arr);
  }

  t.throws(run);
});
