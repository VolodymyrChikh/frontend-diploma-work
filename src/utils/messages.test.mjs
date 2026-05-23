import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createStatus,
  getErrorMessage,
  getValidationMessage,
} from './messages.js';

test('getErrorMessage prefers backend message from axios responses', () => {
  const error = {
    response: {
      data: {
        message: 'Email already exists',
      },
    },
    message: 'Request failed with status code 400',
  };

  assert.equal(getErrorMessage(error, 'Fallback'), 'Email already exists');
});

test('getErrorMessage supports plain backend response text', () => {
  const error = {
    response: {
      data: 'Invalid category',
    },
    message: 'Request failed with status code 400',
  };

  assert.equal(getErrorMessage(error, 'Fallback'), 'Invalid category');
});

test('getErrorMessage supports problem detail responses', () => {
  const error = {
    response: {
      data: {
        title: 'Bad request',
        detail: 'Пароль має бути складнішим',
      },
    },
    message: 'Request failed with status code 400',
  };

  assert.equal(getErrorMessage(error, 'Fallback'), 'Пароль має бути складнішим');
});

test('getErrorMessage supports nested validation details', () => {
  const error = {
    response: {
      data: {
        title: 'Validation failed',
        properties: {
          detail: [
            { message: 'Електронна пошта вже використовується' },
          ],
        },
      },
    },
    message: 'Request failed with status code 400',
  };

  assert.equal(getErrorMessage(error, 'Fallback'), 'Електронна пошта вже використовується');
});

test('getErrorMessage maps network errors to a user friendly message', () => {
  assert.equal(
    getErrorMessage({ message: 'Network Error' }, 'Fallback'),
    'Помилка мережі. Перевірте з’єднання та спробуйте ще раз.',
  );
});

test('getValidationMessage returns field guidance when required fields are missing', () => {
  assert.equal(
    getValidationMessage(false, 'Заповніть обов’язкові поля'),
    'Заповніть обов’язкові поля',
  );
  assert.equal(getValidationMessage(true, 'Заповніть обов’язкові поля'), '');
});

test('createStatus normalizes empty messages to null', () => {
  assert.deepEqual(createStatus('error', ' Помилка '), {
    type: 'error',
    message: 'Помилка',
  });
  assert.equal(createStatus('success', ''), null);
});
