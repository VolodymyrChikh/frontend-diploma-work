import { getErrorMessage } from '../utils/messages.js';

const TECHNICAL_AUTH_MESSAGE_PATTERNS = [
  /^Request failed/i,
  /^Login failed/i,
  /^Registration failed/i,
  /^Failed to get user data/i,
  /^No token received/i,
  /^Token not stored/i,
  /^Invalid token/i,
  /^User with .* not found/i,
  /^Incorrect password/i,
  /Email or password is incorrect/i,
];

async function readResponsePayload(response) {
  const text = await response.text().catch(() => '');

  if (!text) {
    return '';
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function sanitizeAuthErrorMessage(message, fallback) {
  const normalizedMessage = String(message || '').trim();

  if (!normalizedMessage) {
    return fallback;
  }

  const isTechnicalMessage = TECHNICAL_AUTH_MESSAGE_PATTERNS.some((pattern) => (
    pattern.test(normalizedMessage)
  ));

  return isTechnicalMessage ? fallback : normalizedMessage;
}

export function getAuthErrorMessage(error, fallback) {
  return sanitizeAuthErrorMessage(getErrorMessage(error, fallback), fallback);
}

export async function getAuthErrorMessageFromResponse(response, fallback) {
  const data = await readResponsePayload(response);

  return getAuthErrorMessage({
    response: {
      data,
      status: response.status,
    },
    message: fallback,
  }, fallback);
}
