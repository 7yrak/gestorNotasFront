import test from 'node:test';
import assert from 'node:assert/strict';
import { NOTES_API_PATH, isNotesApiRequest } from '../.test-build/api-routing.js';

const host = 'https://example.test';
test('notebooks use the existing root API when the UI is installed in a subdirectory', () => {
  const base = host + '/gestor-notas/';
  const request = new URL(NOTES_API_PATH + '/notebooks/user/owner', base);
  assert.equal(request.href, host + '/api/notebooks/user/owner');
  assert.equal(isNotesApiRequest(request.href, base), true);
});

test('writes to the root business API are eligible for CSRF protection', () => {
  for (const base of [host + '/', host + '/gestor-notas/']) {
    for (const path of ['/api', '/api/notebooks', '/api/pages/page/primary', '/api/backups/import/owner']) {
      assert.equal(isNotesApiRequest(path, base), true);
      assert.equal(isNotesApiRequest(host + path, base), true);
    }
  }
});

test('CSRF routing excludes foreign origins, prefix collisions and authentication', () => {
  const base = host + '/gestor-notas/';
  for (const url of [
    'https://other.test/api/pages', 'http://example.test/api/pages',
    'https://example.test:8443/api/pages', '//other.test/api/pages',
    '/apiculture/pages', '/apiary', '/gestor-notas/auth/login',
    '/gestor-notas/api/notebooks', '/api/../public'
  ]) assert.equal(isNotesApiRequest(url, base), false, url);
});

test('authentication retains the application prefix', () => {
  const base = new URL('./', host + '/gestor-notas/');
  assert.equal(new URL('auth/csrf', base).href, host + '/gestor-notas/auth/csrf');
});
