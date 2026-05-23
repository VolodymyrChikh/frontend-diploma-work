import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMediaResourcePayload,
  formatFileSize,
  getAcceptAttribute,
  getUploadMode,
  getUploadValidationMessage,
  normalizeExternalUrl,
  validateSelectedFiles,
} from './mediaUpload.js';

function file(name, type, size) {
  return { name, type, size };
}

test('getUploadMode separates external links from file uploads', () => {
  assert.equal(getUploadMode('EXTERNAL_LINK'), 'link');
  assert.equal(getUploadMode('DOCUMENT'), 'file');
  assert.equal(getUploadMode('IMAGE'), 'file');
});

test('normalizeExternalUrl accepts only http and https links', () => {
  assert.equal(normalizeExternalUrl(' example.com/doc '), 'https://example.com/doc');
  assert.equal(normalizeExternalUrl('https://example.com/doc'), 'https://example.com/doc');
  assert.equal(normalizeExternalUrl('ftp://example.com/doc'), '');
  assert.equal(normalizeExternalUrl('not a url'), '');
});

test('getAcceptAttribute matches backend-supported upload types', () => {
  assert.match(getAcceptAttribute('DOCUMENT'), /\.pdf/);
  assert.match(getAcceptAttribute('IMAGE'), /image\/png/);
  assert.match(getAcceptAttribute('VIDEO_LINK'), /video\/mp4/);
  assert.equal(getAcceptAttribute('EXTERNAL_LINK'), '');
});

test('validateSelectedFiles rejects too many files, wrong type, and oversized files', () => {
  assert.equal(
    validateSelectedFiles({
      type: 'DOCUMENT',
      files: Array.from({ length: 6 }, (_, index) => file(`doc-${index}.pdf`, 'application/pdf', 1024)),
    }).message,
    'Можна завантажити максимум 5 файлів за раз.',
  );

  assert.equal(
    validateSelectedFiles({
      type: 'IMAGE',
      files: [file('notes.pdf', 'application/pdf', 1024)],
    }).message,
    'Невідповідні файли (світлини): notes.pdf',
  );

  assert.match(
    validateSelectedFiles({
      type: 'DOCUMENT',
      files: [file('huge.pdf', 'application/pdf', 51 * 1024 * 1024)],
    }).message,
    /Файли занадто великі: huge\.pdf/,
  );
});

test('validateSelectedFiles accepts valid files', () => {
  assert.deepEqual(
    validateSelectedFiles({
      type: 'IMAGE',
      files: [file('photo.webp', 'image/webp', 1024)],
    }),
    { valid: true, message: '' },
  );
});

test('getUploadValidationMessage validates file and link modes', () => {
  assert.equal(
    getUploadValidationMessage({
      uploadData: { title: '', categoryId: '1', type: 'DOCUMENT' },
      selectedFiles: [file('doc.pdf', 'application/pdf', 1024)],
    }),
    'Будь ласка, додайте назву матеріалу.',
  );

  assert.equal(
    getUploadValidationMessage({
      uploadData: { title: 'Документ', categoryId: '', type: 'DOCUMENT' },
      selectedFiles: [file('doc.pdf', 'application/pdf', 1024)],
    }),
    'Будь ласка, оберіть категорію.',
  );

  assert.equal(
    getUploadValidationMessage({
      uploadData: { title: 'Документ', categoryId: '1', type: 'DOCUMENT' },
      selectedFiles: [],
    }),
    'Будь ласка, виберіть хоча б один файл.',
  );

  assert.equal(
    getUploadValidationMessage({
      uploadData: { title: 'Лінк', categoryId: '1', type: 'EXTERNAL_LINK', url: 'bad url' },
      selectedFiles: [],
    }),
    'Вставте коректне посилання з http або https.',
  );
});

test('createMediaResourcePayload builds JSON body for external links', () => {
  assert.deepEqual(
    createMediaResourcePayload({
      title: '  Корисний ресурс  ',
      description: '  опис  ',
      type: 'EXTERNAL_LINK',
      categoryId: '4',
      url: 'example.com/resource',
    }),
    {
      title: 'Корисний ресурс',
      description: 'опис',
      type: 'EXTERNAL_LINK',
      categoryId: 4,
      url: 'https://example.com/resource',
      fileUrls: ['https://example.com/resource'],
    },
  );
});

test('formatFileSize produces readable labels', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1536), '1.5 KB');
  assert.equal(formatFileSize(2 * 1024 * 1024), '2 MB');
});
