import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildApiUrl,
  createAuthHeaders,
  normalizeApiBaseUrl,
} from './client.js';

test('normalizeApiBaseUrl removes trailing slashes', () => {
  assert.equal(normalizeApiBaseUrl('http://localhost:9000///'), 'http://localhost:9000');
});

test('normalizeApiBaseUrl keeps empty base URL for same-origin deployment', () => {
  assert.equal(normalizeApiBaseUrl(''), '');
  assert.equal(normalizeApiBaseUrl('/'), '');
  assert.equal(buildApiUrl('/posts?size=10', ''), '/posts?size=10');
  assert.equal(buildApiUrl('comments/post/1', ''), '/comments/post/1');
  assert.equal(buildApiUrl('/posts?size=10', '/'), '/posts?size=10');
});

test('buildApiUrl joins base URL and relative paths consistently', () => {
  assert.equal(
    buildApiUrl('/posts?size=10', 'http://localhost:9000/'),
    'http://localhost:9000/posts?size=10',
  );
  assert.equal(
    buildApiUrl('comments/post/1', 'http://localhost:9000'),
    'http://localhost:9000/comments/post/1',
  );
});

test('buildApiUrl leaves absolute URLs untouched', () => {
  assert.equal(
    buildApiUrl('https://example.com/api/posts', 'http://localhost:9000'),
    'https://example.com/api/posts',
  );
});

test('createAuthHeaders includes bearer token when a token exists', () => {
  const headers = createAuthHeaders(() => 'abc.123');
  assert.deepEqual(headers, { Authorization: 'Bearer abc.123' });
});

test('createAuthHeaders returns empty headers without a token', () => {
  const headers = createAuthHeaders(() => '');
  assert.deepEqual(headers, {});
});

test('createAuthHeaders can skip bearer token for public endpoints', () => {
  const headers = createAuthHeaders(() => 'abc.123', { skipAuth: true });
  assert.deepEqual(headers, {});
});
