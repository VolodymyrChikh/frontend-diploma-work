export const AUTH_REQUIRED_MESSAGE = 'Будь ласка, увійдіть, щоб продовжити.';

export function getReturnPath(location = {}) {
  const pathname = location.pathname || '/';
  const search = location.search || '';
  return `${pathname}${search}`;
}

export function createSignInRedirect(location, message = AUTH_REQUIRED_MESSAGE) {
  return {
    to: '/signin',
    options: {
      replace: true,
      state: {
        from: getReturnPath(location),
        message,
      },
    },
  };
}

export function isPrivateRouteAllowed({ loading, isAuthenticated } = {}) {
  if (loading) {
    return { status: 'loading' };
  }

  return isAuthenticated ? { status: 'allow' } : { status: 'redirect' };
}

export function canUseAuthenticatedAction({ isAuthenticated, user } = {}) {
  return Boolean(isAuthenticated && user?.id);
}
