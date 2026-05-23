import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROFILE_GROUP_OPTIONS,
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
  groupName: 'PMI-41',
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
    groupName: 'PMI-41',
    bio: '',
    githubLink: '',
  });
});

test('createProfileUpdatePayload preserves immutable profile fields and trims editable fields', () => {
  const payload = createProfileUpdatePayload(user, {
    specialtyId: '3',
    groupName: '',
    bio: '  люблю алгоритми  ',
    githubLink: ' github.com/student ',
  });

  assert.deepEqual(payload, {
    firstName: 'Вова',
    lastName: 'Чіх',
    email: 'student@example.com',
    specialtyId: 3,
    groupName: null,
    bio: 'люблю алгоритми',
    githubLink: 'https://github.com/student',
    status: 'ONLINE',
    avatarLink: 'https://example.com/avatar.png',
  });
});

test('profile group options match backend-supported student groups', () => {
  assert.deepEqual(PROFILE_GROUP_OPTIONS, ['PMI-41', 'PMI-42', 'PMI-43', 'PMI-44', 'PMI-45', 'PMI-46']);
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
