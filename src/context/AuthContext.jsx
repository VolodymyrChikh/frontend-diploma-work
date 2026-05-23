import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { apiFetch } from '../api/client';
import { AuthContext } from './auth-context.js';
import { getAuthErrorMessage, getAuthErrorMessageFromResponse } from '../auth/errors.js';
import {
    clearStoredAuth,
    getStoredAuthInfo,
    getStoredToken,
    getStoredUser,
    getTokenFromAuthResponse,
    setStoredToken,
    setStoredUser,
} from '../auth/storage.js';

const LOGIN_ERROR_MESSAGE = 'Невірний email або пароль';
const LOGIN_FALLBACK_MESSAGE = 'Не вдалося увійти. Перевірте дані та спробуйте ще раз.';
const REGISTER_FALLBACK_MESSAGE = 'Не вдалося зареєструватися. Перевірте дані та спробуйте ще раз.';
const TOKEN_FALLBACK_MESSAGE = 'Не вдалося підтвердити вхід. Спробуйте увійти ще раз.';

async function requestCurrentUser() {
    const userResponse = await apiFetch('/users/me', {
        method: 'GET'
    });

    if (!userResponse.ok) {
        throw new Error('Failed to get user data');
    }

    return userResponse.json();
}

async function setAuthenticatedSession({ token, fallbackUser, setUser, setIsAuthenticated }) {
    if (!token) {
        throw new Error('No token received');
    }

    setStoredToken(token);

    if (fallbackUser) {
        setStoredUser(fallbackUser);
    }

    const userData = await requestCurrentUser();
    setStoredUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
}

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const activeToken = getStoredToken();
        const storedUser = getStoredUser();
        
        if (activeToken) {
            if (storedUser) {
                setUser(storedUser);
                setIsAuthenticated(true);
            }

            requestCurrentUser()
            .then(userData => {
                setStoredUser(userData);
                setUser(userData);
                setIsAuthenticated(true);
            })
            .catch((err) => {
                console.error("Auth check error:", err);
                clearStoredAuth();
                setIsAuthenticated(false);
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });
        } else {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
        }
    }, []);

    const authenticateWithToken = useCallback(async (token) => {
        try {
            await setAuthenticatedSession({
                token,
                setUser,
                setIsAuthenticated,
            });
            return { success: true };
        } catch (error) {
            console.error("Token authentication error:", error);
            clearStoredAuth();
            setIsAuthenticated(false);
            setUser(null);
            return { success: false, error: getAuthErrorMessage(error, TOKEN_FALLBACK_MESSAGE) };
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiFetch('/auth/authenticate', {
                skipAuth: true,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const fallback = response.status === 401 ? LOGIN_ERROR_MESSAGE : LOGIN_FALLBACK_MESSAGE;
                return {
                    success: false,
                    error: await getAuthErrorMessageFromResponse(response, fallback),
                };
            }

            const data = await response.json();
            const tokenToUse = getTokenFromAuthResponse(data);

            await setAuthenticatedSession({
                token: tokenToUse,
                fallbackUser: data.user,
                setUser,
                setIsAuthenticated,
            });
            return { success: true };
        } catch (error) {
            console.error("Login process error:", error);
            clearStoredAuth();
            setIsAuthenticated(false);
            setUser(null);
            return { success: false, error: getAuthErrorMessage(error, LOGIN_FALLBACK_MESSAGE) };
        }
    };

    const register = async (userData) => {
        try {
            const response = await apiFetch('/auth/register', {
                skipAuth: true,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: await getAuthErrorMessageFromResponse(response, REGISTER_FALLBACK_MESSAGE),
                };
            }

            const data = await response.json();
            const tokenToUse = getTokenFromAuthResponse(data);

            await setAuthenticatedSession({
                token: tokenToUse,
                fallbackUser: data.user,
                setUser,
                setIsAuthenticated,
            });
            return { success: true, data };
        } catch (error) {
            clearStoredAuth();
            setIsAuthenticated(false);
            setUser(null);
            return { success: false, error: getAuthErrorMessage(error, REGISTER_FALLBACK_MESSAGE) };
        }
    };

    const logout = () => {
        clearStoredAuth();
        setIsAuthenticated(false);
        setUser(null);
    };

    const updateCurrentUser = (nextUser) => {
        if (!nextUser) {
            return;
        }

        setStoredUser(nextUser);
        setUser(nextUser);
        setIsAuthenticated(true);
    };

    const getAuthInfo = () => {
        return getStoredAuthInfo(isAuthenticated);
    };
    
    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                loading,
                login,
                register,
                authenticateWithToken,
                updateCurrentUser,
                logout,
                getAuthInfo
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
