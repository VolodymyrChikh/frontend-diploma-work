export const AUTH_TOKEN_KEY = 'authToken';
export const LEGACY_TOKEN_KEY = 'token';
export const USER_DATA_KEY = 'userData';

function getBrowserStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function getStoredToken(storage = getBrowserStorage()) {
  if (!storage) {
    return null;
  }

  const authToken = storage.getItem(AUTH_TOKEN_KEY);
  const legacyToken = storage.getItem(LEGACY_TOKEN_KEY);

  if (authToken) {
    if (legacyToken) {
      storage.removeItem(LEGACY_TOKEN_KEY);
    }
    return authToken;
  }

  if (legacyToken) {
    storage.setItem(AUTH_TOKEN_KEY, legacyToken);
    storage.removeItem(LEGACY_TOKEN_KEY);
    return legacyToken;
  }

  return null;
}

export function setStoredToken(token, storage = getBrowserStorage()) {
  if (!storage) {
    return;
  }

  storage.removeItem(LEGACY_TOKEN_KEY);

  if (token) {
    storage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    storage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function clearStoredAuth(storage = getBrowserStorage()) {
  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_TOKEN_KEY);
  storage.removeItem(LEGACY_TOKEN_KEY);
  storage.removeItem(USER_DATA_KEY);
}

export function getStoredUser(storage = getBrowserStorage()) {
  if (!storage) {
    return null;
  }

  const userData = storage.getItem(USER_DATA_KEY);
  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData);
  } catch {
    storage.removeItem(USER_DATA_KEY);
    return null;
  }
}

export function setStoredUser(user, storage = getBrowserStorage()) {
  if (!storage) {
    return;
  }

  if (user) {
    storage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } else {
    storage.removeItem(USER_DATA_KEY);
  }
}

export function getTokenFromAuthResponse(data) {
  if (data?.token?.token) {
    return data.token.token;
  }

  if (typeof data?.token === 'string') {
    return data.token;
  }

  return null;
}

export function getTokenFromSearch(search) {
  const params = new URLSearchParams(search);
  return params.get('token') || params.get('accessToken');
}

export function getStoredAuthInfo(isAuthenticated, storage = getBrowserStorage()) {
  return {
    hasAuthToken: !!storage?.getItem(AUTH_TOKEN_KEY),
    hasLegacyToken: !!storage?.getItem(LEGACY_TOKEN_KEY),
    hasUserData: !!storage?.getItem(USER_DATA_KEY),
    isAuthenticated,
  };
}
