import { createSignInRedirect } from './guards.js';
import { readJsonPayload } from '../utils/apiPayload.js';
import { getErrorMessage } from '../utils/messages.js';

export const AUTH_EXPIRED_MESSAGE = 'Сесія завершилася. Увійдіть ще раз, щоб продовжити.';

function getStatus(source) {
  return source?.status ?? source?.response?.status ?? null;
}

function isFetchResponse(source) {
  return typeof source?.text === 'function' && typeof source?.headers?.get === 'function';
}

export function isAuthFailure(source) {
  const status = getStatus(source);
  return status === 401 || status === 403;
}

export async function getProtectedActionErrorMessage(source, fallback) {
  if (isAuthFailure(source)) {
    return AUTH_EXPIRED_MESSAGE;
  }

  if (!isFetchResponse(source)) {
    return getErrorMessage(source, fallback);
  }

  const payload = await readJsonPayload(source);

  if (payload) {
    return getErrorMessage({
      response: {
        data: payload,
        status: source.status,
      },
    }, fallback);
  }

  const text = await source.text().catch(() => '');

  return getErrorMessage({
    response: {
      data: text,
      status: source.status,
    },
  }, fallback);
}

export function redirectToSignInOnAuthFailure(source, {
  logout,
  navigate,
  location,
  message = AUTH_EXPIRED_MESSAGE,
} = {}) {
  if (!isAuthFailure(source)) {
    return false;
  }

  logout?.();

  if (typeof navigate === 'function') {
    const redirect = createSignInRedirect(location, message);
    navigate(redirect.to, redirect.options);
  }

  return true;
}
