import { getErrorMessage } from '../../utils/messages.js';
import { readJsonPayload } from '../../utils/apiPayload.js';
import { AUTH_EXPIRED_MESSAGE, isAuthFailure } from '../../auth/protectedActions.js';

export const PROFILE_GROUP_OPTIONS = ['PMI-41', 'PMI-42', 'PMI-43', 'PMI-44', 'PMI-45', 'PMI-46'];

const DEFAULT_PROFILE_SAVE_ERROR = 'Не вдалося зберегти профіль. Перевірте введені дані.';

export function normalizeGithubUrl(githubLink) {
  const trimmedLink = String(githubLink || '').trim();

  if (!trimmedLink) {
    return null;
  }

  return /^https?:\/\//i.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`;
}

export function createProfileFormState(user = {}) {
  return {
    specialtyId: user.specialtyResponse?.id || '',
    groupName: user.groupName || '',
    bio: user.bio || '',
    githubLink: user.githubLink || '',
  };
}

export function createProfileUpdatePayload(user = {}, formData = {}) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    specialtyId: formData.specialtyId ? Number(formData.specialtyId) : null,
    groupName: formData.groupName?.trim() || null,
    bio: formData.bio?.trim() || null,
    githubLink: normalizeGithubUrl(formData.githubLink),
    status: user.status || 'offline',
    avatarLink: user.avatarLink,
  };
}

export function isAuthExpiredResponse(response) {
  return isAuthFailure(response);
}

export async function getProfileResponseErrorMessage(
  response,
  fallback = DEFAULT_PROFILE_SAVE_ERROR,
) {
  if (isAuthExpiredResponse(response)) {
    return AUTH_EXPIRED_MESSAGE;
  }

  const payload = await readJsonPayload(response);

  if (payload) {
    return getErrorMessage({
      response: {
        data: payload,
        status: response.status,
      },
    }, fallback);
  }

  const text = await response.text().catch(() => '');

  return getErrorMessage({
    response: {
      data: text,
      status: response.status,
    },
  }, fallback);
}
