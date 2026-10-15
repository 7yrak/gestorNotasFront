import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AutosaveQueue } from '../.test-build/autosave-queue.js';
const tick = () => new Promise(resolve => setTimeout(resolve, 10));

test('switching pages flushes both drafts without replacing the first', async () => {
  const writes = [];
  const queue = new AutosaveQueue(() => {});
  queue.schedule('a', 'content', async () => { writes.push('a'); }, 400);
  queue.flush();
  queue.schedule('b', 'content', async () => { writes.push('b'); }, 400);
  queue.flush();
  await tick();
  assert.deepEqual(writes, ['a', 'b']);
  assert.equal(queue.status('a'), 'saved');
});

test('a pending title survives edits to another page', async () => {
  const writes = [];
  const queue = new AutosaveQueue(() => {});
  queue.schedule('a', 'title', async () => { writes.push('title a'); }, 500);
  queue.schedule('b', 'title', async () => { writes.push('title b'); }, 500);
  queue.flush();
  await tick();
  assert.deepEqual(writes, ['title a', 'title b']);
});

test('writes to one field are serialized and newest pending draft wins', async () => {
  let finish;
  const writes = [];
  const queue = new AutosaveQueue(() => {});
  queue.schedule('a', 'content', () => new Promise(resolve => { finish = resolve; writes.push(1); }), 0);
  queue.flush();
  queue.schedule('a', 'content', async () => { writes.push(2); }, 400);
  queue.schedule('a', 'content', async () => { writes.push(3); }, 400);
  queue.flush();
  assert.deepEqual(writes, [1]);
  finish();
  await tick();
  assert.deepEqual(writes, [1, 3]);
});

test('title completion cannot mark pending content as saved', async () => {
  let finish;
  const queue = new AutosaveQueue(() => {});
  queue.schedule('a', 'content', () => new Promise(resolve => { finish = resolve; }), 0);
  queue.schedule('a', 'title', async () => {}, 0);
  queue.flush();
  await tick();
  assert.equal(queue.status('a'), 'saving');
  assert.equal(queue.status('b'), 'idle');
  finish();
  await tick();
  assert.equal(queue.status('a'), 'saved');
});

test('failed saves remain available and are retried on flush', async () => {
  let attempts = 0;
  const queue = new AutosaveQueue(() => {});
  queue.schedule('a', 'content', async () => { if (++attempts === 1) throw Error('offline'); }, 0);
  queue.flush();
  await tick();
  assert.equal(queue.status('a'), 'error');
  queue.flush();
  await tick();
  assert.equal(attempts, 2);
  assert.equal(queue.status('a'), 'saved');
});

test('an old page completing does not clear the active page pending status', async () => {
  let finish;
  const queue = new AutosaveQueue(() => {});
  queue.schedule('a', 'content', () => new Promise(resolve => { finish = resolve; }), 0);
  queue.flush();
  queue.schedule('b', 'content', async () => {}, 500);
  finish();
  await tick();
  assert.equal(queue.status('a'), 'saved');
  assert.equal(queue.status('b'), 'saving');
  queue.flush();
  await tick();
});
