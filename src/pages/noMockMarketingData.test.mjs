import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const sourceFiles = [
  new URL('./MainPage/MainPage.jsx', import.meta.url),
  new URL('./Forum Page/Forum.jsx', import.meta.url),
  new URL('./Profile Page/Profile.jsx', import.meta.url),
  new URL('./Auth Page/SignIn/Authenticate.jsx', import.meta.url),
  new URL('./Auth Page/SignUp/Register.jsx', import.meta.url),
  new URL('./MediaHub/MediaHub.jsx', import.meta.url),
  new URL('./Course Map Page/CourseMapPage.jsx', import.meta.url),
  new URL('./Create Post Page/CreatePost.jsx', import.meta.url),
  new URL('./Post Detail Page/PostDetail.jsx', import.meta.url),
  new URL('../components/Footer/Footer.jsx', import.meta.url),
];

const forbiddenMockData = [
  'HERO_STATS',
  'POPULAR_TOPICS',
  'CATEGORY_COUNTS',
  'HERO_METRICS',
  'STAT_ITEMS',
  '12 842',
  '6 231',
  '3 487',
  '1.2K',
  '1.2K+',
  'Онлайн зараз',
  '+128',
  'value: 24',
  'value: 128',
  'value: 17',
  'value: 56',
];

const forbiddenTemplateCopy = [
  'ком&apos;юніті',
  "ком'юніті",
  'name@example.com',
  'https://example.com/resource',
  'бекенд',
  'API або',
  "Об'єднуємо знання",
  'отримай доступ до спільноти',
  'в одному місці',
  'реальні обговорення',
  'доступні на порталі',
  'знаходь однодумців',
  'успішного навчання',
  'створено для тебе',
];

test('public pages do not expose hard-coded marketing metrics', async () => {
  const sources = await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')));
  const combinedSource = sources.join('\n');

  for (const token of forbiddenMockData) {
    assert.equal(
      combinedSource.includes(token),
      false,
      `Remove hard-coded mock data token: ${token}`,
    );
  }
});

test('public pages avoid template-like generated copy', async () => {
  const sources = await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')));
  const combinedSource = sources.join('\n');

  for (const token of forbiddenTemplateCopy) {
    assert.equal(
      combinedSource.includes(token),
      false,
      `Replace template-like copy token: ${token}`,
    );
  }
});
