export const MAX_FILES_PER_UPLOAD = 5;
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/csv',
  'application/rtf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
];

const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
];

const VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/mpeg',
  'video/x-msvideo',
];

const ACCEPT_BY_TYPE = {
  DOCUMENT: '.pdf,.txt,.csv,.rtf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp',
  IMAGE: IMAGE_TYPES.join(','),
  VIDEO_LINK: VIDEO_TYPES.join(','),
  VIDEO: VIDEO_TYPES.join(','),
  EXTERNAL_LINK: '',
};

const CONTENT_TYPES_BY_TYPE = {
  DOCUMENT: DOCUMENT_TYPES,
  IMAGE: IMAGE_TYPES,
  VIDEO_LINK: VIDEO_TYPES,
  VIDEO: VIDEO_TYPES,
};

const TYPE_LABELS = {
  DOCUMENT: 'документи',
  IMAGE: 'світлини',
  VIDEO_LINK: 'відео',
  VIDEO: 'відео',
};

export function getUploadMode(type) {
  return type === 'EXTERNAL_LINK' ? 'link' : 'file';
}

export function getAcceptAttribute(type) {
  return Object.prototype.hasOwnProperty.call(ACCEPT_BY_TYPE, type)
    ? ACCEPT_BY_TYPE[type]
    : ACCEPT_BY_TYPE.DOCUMENT;
}

export function normalizeExternalUrl(value) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return '';
  }

  const hasExplicitScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue);

  if (hasExplicitScheme && !/^https?:\/\//i.test(trimmedValue)) {
    return '';
  }

  const candidate = hasExplicitScheme ? trimmedValue : `https://${trimmedValue}`;

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function formatFileSize(size) {
  const bytes = Number(size || 0);

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${Number(kilobytes.toFixed(1))} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${Number(megabytes.toFixed(1))} MB`;
}

export function validateSelectedFiles({ type, files }) {
  const selectedFiles = Array.from(files || []);

  if (selectedFiles.length > MAX_FILES_PER_UPLOAD) {
    return {
      valid: false,
      message: `Можна завантажити максимум ${MAX_FILES_PER_UPLOAD} файлів за раз.`,
    };
  }

  const validTypes = CONTENT_TYPES_BY_TYPE[type] || [];
  const invalidFiles = selectedFiles.filter((file) => {
    const contentType = String(file.type || '').toLowerCase().split(';')[0].trim();
    return !validTypes.includes(contentType);
  });

  if (invalidFiles.length > 0) {
    const typeLabel = TYPE_LABELS[type] || 'файли';
    return {
      valid: false,
      message: `Невідповідні файли (${typeLabel}): ${invalidFiles.map((file) => file.name).join(', ')}`,
    };
  }

  const oversizedFiles = selectedFiles.filter((file) => Number(file.size || 0) > MAX_FILE_SIZE_BYTES);

  if (oversizedFiles.length > 0) {
    const errorMessage = oversizedFiles
      .map((file) => `${file.name} (${formatFileSize(file.size)}, макс: 50 MB)`)
      .join(', ');

    return {
      valid: false,
      message: `Файли занадто великі: ${errorMessage}`,
    };
  }

  return { valid: true, message: '' };
}

export function getUploadValidationMessage({ uploadData, selectedFiles }) {
  if (!uploadData?.title?.trim()) {
    return 'Будь ласка, додайте назву матеріалу.';
  }

  if (!uploadData?.categoryId) {
    return 'Будь ласка, оберіть категорію.';
  }

  if (getUploadMode(uploadData.type) === 'link') {
    return normalizeExternalUrl(uploadData.url)
      ? ''
      : 'Вставте коректне посилання з http або https.';
  }

  const selectedFileList = Array.from(selectedFiles || []);

  if (selectedFileList.length === 0) {
    return 'Будь ласка, виберіть хоча б один файл.';
  }

  return validateSelectedFiles({
    type: uploadData.type,
    files: selectedFileList,
  }).message;
}

export function createMediaResourcePayload(uploadData) {
  const url = normalizeExternalUrl(uploadData?.url);

  return {
    title: uploadData.title.trim(),
    description: uploadData.description?.trim() || null,
    type: uploadData.type,
    categoryId: Number(uploadData.categoryId),
    url,
    fileUrls: [url],
  };
}
