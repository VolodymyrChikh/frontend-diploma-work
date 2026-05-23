import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearStoredAuth,
  getStoredAuthInfo,
  getStoredToken,
  getStoredUser,
  getTokenFromAuthResponse,
  getTokenFromSearch,
  setStoredToken,
  setStoredUser,
} from './storage.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('getStoredToken prefers authToken and removes legacy token', () => {
  const storage = createStorage({ authToken: 'new-token', token: 'legacy-token' });

  assert.equal(getStoredToken(storage), 'new-token');
  assert.equal(storage.getItem('authToken'), 'new-token');
  assert.equal(storage.getItem('token'), null);
});

test('getStoredToken migrates legacy token into authToken', () => {
  const storage = createStorage({ token: 'legacy-token' });

  assert.equal(getStoredToken(storage), 'legacy-token');
  assert.equal(storage.getItem('authToken'), 'legacy-token');
  assert.equal(storage.getItem('token'), null);
});

test('setStoredToken writes only the canonical token key', () => {
  const storage = createStorage({ token: 'old-token' });

  setStoredToken('fresh-token', storage);

  assert.equal(storage.getItem('authToken'), 'fresh-token');
  assert.equal(storage.getItem('token'), null);
});

test('clearStoredAuth removes token and user data keys', () => {
  const storage = createStorage({
    authToken: 'auth-token',
    token: 'legacy-token',
    userData: '{"id":1}',
  });

  clearStoredAuth(storage);

  assert.equal(storage.getItem('authToken'), null);
  assert.equal(storage.getItem('token'), null);
  assert.equal(storage.getItem('userData'), null);
});

test('getStoredUser parses stored user data and clears invalid json', () => {
  const storage = createStorage({ userData: '{"id":7,"firstName":"Ada"}' });

  assert.deepEqual(getStoredUser(storage), { id: 7, firstName: 'Ada' });

  const invalidStorage = createStorage({ userData: '{bad json' });
  assert.equal(getStoredUser(invalidStorage), null);
  assert.equal(invalidStorage.getItem('userData'), null);
});

test('setStoredUser writes and clears user data', () => {
  const storage = createStorage();

  setStoredUser({ id: 2 }, storage);
  assert.equal(storage.getItem('userData'), '{"id":2}');

  setStoredUser(null, storage);
  assert.equal(storage.getItem('userData'), null);
});

test('getTokenFromAuthResponse supports nested and plain token responses', () => {
  assert.equal(getTokenFromAuthResponse({ token: { token: 'nested-token' } }), 'nested-token');
  assert.equal(getTokenFromAuthResponse({ token: 'plain-token' }), 'plain-token');
  assert.equal(getTokenFromAuthResponse({}), null);
});

test('getTokenFromSearch accepts token and accessToken query params', () => {
  assert.equal(getTokenFromSearch('?token=plain'), 'plain');
  assert.equal(getTokenFromSearch('?accessToken=oauth'), 'oauth');
  assert.equal(getTokenFromSearch('?x=1'), null);
});

test('getStoredAuthInfo reports canonical token, legacy token, and user data state', () => {
  const storage = createStorage({ authToken: 'auth-token', token: 'legacy-token', userData: '{}' });

  assert.deepEqual(getStoredAuthInfo(false, storage), {
    hasAuthToken: true,
    hasLegacyToken: true,
    hasUserData: true,
    isAuthenticated: false,
  });
});
