import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAuthErrorMessage,
  sanitizeAuthErrorMessage,
} from './errors.js';

test('sanitizeAuthErrorMessage keeps backend Ukrainian problem details', () => {
  assert.equal(
    sanitizeAuthErrorMessage('Ця електронна пошта вже використовується', 'Fallback'),
    'Ця електронна пошта вже використовується',
  );
});

test('sanitizeAuthErrorMessage hides technical auth messages', () => {
  assert.equal(
    sanitizeAuthErrorMessage('Request failed with status code 401', 'Невірний email або пароль'),
    'Невірний email або пароль',
  );
  assert.equal(
    sanitizeAuthErrorMessage('User with email=[student@example.com] not found', 'Невірний email або пароль'),
    'Невірний email або пароль',
  );
});

test('getAuthErrorMessage reads Spring problem details safely', () => {
  const error = {
    response: {
      data: {
        title: 'Невірні дані для входу',
        detail: 'Невірний email або пароль',
      },
    },
    message: 'Request failed with status code 401',
  };

  assert.equal(getAuthErrorMessage(error, 'Fallback'), 'Невірний email або пароль');
});
