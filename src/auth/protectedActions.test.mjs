import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AUTH_EXPIRED_MESSAGE,
  getProtectedActionErrorMessage,
  isAuthFailure,
  redirectToSignInOnAuthFailure,
} from './protectedActions.js';

test('isAuthFailure detects fetch and axios 401/403 responses', () => {
  assert.equal(isAuthFailure({ status: 401 }), true);
  assert.equal(isAuthFailure({ status: 403 }), true);
  assert.equal(isAuthFailure({ status: 400 }), false);
  assert.equal(isAuthFailure({ response: { status: 401 } }), true);
  assert.equal(isAuthFailure({ response: { status: 500 } }), false);
});

test('getProtectedActionErrorMessage returns auth message for expired sessions', async () => {
  const response = new Response(JSON.stringify({ detail: 'Full authentication is required' }), {
    status: 401,
    headers: { 'content-type': 'application/problem+json' },
  });

  assert.equal(
    await getProtectedActionErrorMessage(response, 'Fallback'),
    AUTH_EXPIRED_MESSAGE,
  );
});

test('getProtectedActionErrorMessage extracts backend problem detail for validation errors', async () => {
  const response = new Response(JSON.stringify({
    title: 'Перевірка даних не пройдена',
    detail: 'Назва поста не може бути порожньою',
  }), {
    status: 400,
    headers: { 'content-type': 'application/problem+json' },
  });

  assert.equal(
    await getProtectedActionErrorMessage(response, 'Fallback'),
    'Назва поста не може бути порожньою',
  );
});

test('redirectToSignInOnAuthFailure clears auth and preserves return path', () => {
  let loggedOut = false;
  let navigation = null;

  const handled = redirectToSignInOnAuthFailure({ response: { status: 403 } }, {
    logout: () => {
      loggedOut = true;
    },
    navigate: (to, options) => {
      navigation = { to, options };
    },
    location: { pathname: '/forum/post/test', search: '?reply=1' },
  });

  assert.equal(handled, true);
  assert.equal(loggedOut, true);
  assert.equal(navigation.to, '/signin');
  assert.equal(navigation.options.state.from, '/forum/post/test?reply=1');
  assert.equal(navigation.options.state.message, AUTH_EXPIRED_MESSAGE);
});

test('redirectToSignInOnAuthFailure ignores non-auth failures', () => {
  let loggedOut = false;

  const handled = redirectToSignInOnAuthFailure({ status: 400 }, {
    logout: () => {
      loggedOut = true;
    },
    navigate: () => {},
    location: { pathname: '/media' },
  });

  assert.equal(handled, false);
  assert.equal(loggedOut, false);
});
