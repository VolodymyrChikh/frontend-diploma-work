const NETWORK_ERROR_MESSAGE = 'Помилка мережі. Перевірте з’єднання та спробуйте ще раз.';

function getNestedDetailMessage(data) {
  const nestedDetail = data?.properties?.detail ?? data?.detail;

  if (typeof nestedDetail === 'string' && nestedDetail.trim()) {
    return nestedDetail.trim();
  }

  if (Array.isArray(nestedDetail)) {
    const firstMessage = nestedDetail
      .map((item) => item?.message || item?.detail || item?.defaultMessage || item)
      .find((message) => typeof message === 'string' && message.trim());

    if (firstMessage) {
      return firstMessage.trim();
    }
  }

  return '';
}

export function getErrorMessage(error, fallback = 'Сталася помилка. Спробуйте ще раз.') {
  if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data.trim();
  }

  if (error?.response?.data?.message) {
    return String(error.response.data.message).trim();
  }

  const detailMessage = getNestedDetailMessage(error?.response?.data);
  if (detailMessage) {
    return detailMessage;
  }

  if (error?.response?.data?.title) {
    return String(error.response.data.title).trim();
  }

  if (error?.message === 'Network Error') {
    return NETWORK_ERROR_MESSAGE;
  }

  if (error?.message) {
    return String(error.message).trim();
  }

  return fallback;
}

export function getValidationMessage(isValid, message) {
  return isValid ? '' : message;
}

export function createStatus(type, message) {
  const normalizedMessage = String(message || '').trim();

  if (!normalizedMessage) {
    return null;
  }

  return {
    type,
    message: normalizedMessage,
  };
}
