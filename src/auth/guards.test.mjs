import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AUTH_REQUIRED_MESSAGE,
  canUseAuthenticatedAction,
  createSignInRedirect,
  getReturnPath,
  isPrivateRouteAllowed,
} from './guards.js';

test('getReturnPath keeps pathname and search for login redirects', () => {
  assert.equal(getReturnPath({ pathname: '/media', search: '?type=IMAGE' }), '/media?type=IMAGE');
  assert.equal(getReturnPath({ pathname: '/profile', search: '' }), '/profile');
});

test('createSignInRedirect includes target and user-facing message', () => {
  assert.deepEqual(
    createSignInRedirect({ pathname: '/create-post', search: '' }, 'Увійдіть'),
    {
      to: '/signin',
      options: {
        replace: true,
        state: {
          from: '/create-post',
          message: 'Увійдіть',
        },
      },
    },
  );

  assert.equal(createSignInRedirect({ pathname: '/profile' }).options.state.message, AUTH_REQUIRED_MESSAGE);
});

test('isPrivateRouteAllowed waits for auth state and only allows authenticated users', () => {
  assert.deepEqual(isPrivateRouteAllowed({ loading: true, isAuthenticated: false }), { status: 'loading' });
  assert.deepEqual(isPrivateRouteAllowed({ loading: false, isAuthenticated: false }), { status: 'redirect' });
  assert.deepEqual(isPrivateRouteAllowed({ loading: false, isAuthenticated: true }), { status: 'allow' });
});

test('canUseAuthenticatedAction requires both auth state and current user id', () => {
  assert.equal(canUseAuthenticatedAction({ isAuthenticated: true, user: { id: 1 } }), true);
  assert.equal(canUseAuthenticatedAction({ isAuthenticated: true, user: null }), false);
  assert.equal(canUseAuthenticatedAction({ isAuthenticated: false, user: { id: 1 } }), false);
});
