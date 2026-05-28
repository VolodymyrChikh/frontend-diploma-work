import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createProfileFormState,
  createProfileUpdatePayload,
  getProfileResponseErrorMessage,
  isAuthExpiredResponse,
  normalizeGithubUrl,
} from './profileForm.js';

const user = {
  id: 7,
  firstName: 'Вова',
  lastName: 'Чіх',
  email: 'student@example.com',
  specialtyResponse: { id: 2, name: 'Компʼютерні науки' },
  avatarLink: 'https://example.com/avatar.png',
  groupResponse: { id: 11, name: 'PMI-41' },
  status: 'ONLINE',
};

test('normalizeGithubUrl trims links and prefixes missing protocol', () => {
  assert.equal(normalizeGithubUrl(' github.com/student '), 'https://github.com/student');
  assert.equal(normalizeGithubUrl('https://github.com/student'), 'https://github.com/student');
  assert.equal(normalizeGithubUrl(''), null);
});

test('createProfileFormState uses current user data without leaking undefined values', () => {
  assert.deepEqual(createProfileFormState(user), {
    specialtyId: 2,
    groupId: 11,
    bio: '',
    githubLink: '',
  });
});

test('createProfileUpdatePayload preserves immutable profile fields and trims editable fields', () => {
  const payload = createProfileUpdatePayload(user, {
    specialtyId: '3',
    groupId: '11',
    bio: '  люблю алгоритми  ',
    githubLink: ' github.com/student ',
  });

  assert.deepEqual(payload, {
    firstName: 'Вова',
    lastName: 'Чіх',
    email: 'student@example.com',
    specialtyId: 3,
    groupId: 11,
    bio: 'люблю алгоритми',
    githubLink: 'https://github.com/student',
    status: 'ONLINE',
    avatarLink: 'https://example.com/avatar.png',
  });
});

test('getProfileResponseErrorMessage extracts Ukrainian problem details', async () => {
  const response = new Response(JSON.stringify({
    title: 'Перевірка даних не пройдена',
    detail: 'Розмір опису про себе не може перевищувати 500 символів',
  }), {
    status: 400,
    headers: { 'content-type': 'application/problem+json' },
  });

  assert.equal(
    await getProfileResponseErrorMessage(response),
    'Розмір опису про себе не може перевищувати 500 символів',
  );
});

test('isAuthExpiredResponse detects protected profile failures', () => {
  assert.equal(isAuthExpiredResponse({ status: 401 }), true);
  assert.equal(isAuthExpiredResponse({ status: 403 }), true);
  assert.equal(isAuthExpiredResponse({ status: 400 }), false);
});
