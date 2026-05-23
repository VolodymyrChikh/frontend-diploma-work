import { useCallback, useEffect, useState, useRef } from 'react';
import { apiFetch } from '../../api/client';
import {
    getProtectedActionErrorMessage,
    isAuthFailure,
} from '../../auth/protectedActions.js';

function formatRelativeTime(input) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return '';
    const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
    if (diffSec < 45) return 'щойно';
    if (diffSec < 90) return 'хвилину тому';
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} хв тому`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} год тому`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 7) return `${diffDay} дн тому`;
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

function NotificationPopup({ id, isOpen, onClose, onAuthExpired }) {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const popupRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            let allNotifications = [];
            let currentPage = 0;
            let isLastPage = false;

            while (!isLastPage) {
                const response = await apiFetch(`/notifications?page=${currentPage}&size=10`);
                if (response.ok) {
                    const data = await response.json();
                    allNotifications = [...allNotifications, ...data.content];
                    isLastPage = data.last;
                    currentPage++;
                } else if (isAuthFailure(response)) {
                    const message = await getProtectedActionErrorMessage(
                        response,
                        'Сесія завершилася. Увійдіть ще раз, щоб продовжити.',
                    );
                    onAuthExpired?.(message);
                    break;
                } else {
                    break;
                }
            }

            const sortedNotifications = allNotifications.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setNotifications(sortedNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [onAuthExpired]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }

        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [fetchNotifications, isOpen, onClose]);

    const markAsRead = async (notificationId) => {
        try {
            const response = await apiFetch(`/notifications/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isRead: true
                }),
            });

            if (!response.ok) {
                if (isAuthFailure(response)) {
                    const message = await getProtectedActionErrorMessage(
                        response,
                        'Сесія завершилася. Увійдіть ще раз, щоб продовжити.',
                    );
                    onAuthExpired?.(message);
                }
                return;
            }

            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    if (!isOpen) return null;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div
            id={id}
            ref={popupRef}
            role="dialog"
            aria-label="Сповіщення"
            className="ami-elevated ami-popover-motion absolute right-0 top-full z-40 mt-3 w-[min(92vw,380px)] overflow-hidden rounded-ami border border-border bg-white"
        >
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-sans text-xl/7 font-black text-ink">Сповіщення</h3>
                    {unreadCount > 0 && (
                        <span className="inline-flex min-w-6 items-center justify-center rounded-ami bg-accent px-2 py-0.5 text-xs/4 font-black text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрити сповіщення"
                    className="grid size-9 place-items-center rounded-ami border border-border bg-transparent text-ink transition duration-200 ease-out hover:border-accent hover:bg-accent hover:text-white active:bg-accent-strong focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus)"
                >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto bg-surface p-3">
                {isLoading && notifications.length === 0 ? (
                    <div className="space-y-2" aria-live="polite" aria-busy="true">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="rounded-ami border border-border bg-white p-4">
                                <div className="ami-skeleton h-4 w-20" />
                                <div className="ami-skeleton mt-3 h-3.5 w-full" />
                                <div className="ami-skeleton mt-2 h-3.5 w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-ami border border-dashed border-border bg-white px-4 py-10 text-center">
                        <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
                            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                        </span>
                        <p className="text-sm/6 font-bold text-muted">Немає нових сповіщень</p>
                    </div>
                ) : (
                    <ul className="m-0 list-none space-y-2 p-0">
                        {notifications.map((notification) => (
                            <li key={notification.id}>
                                <button
                                    type="button"
                                    className="group relative w-full rounded-ami border border-border bg-white p-4 text-left transition duration-200 ease-out hover:-translate-y-px hover:border-accent/40 hover:bg-soft focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus) motion-reduce:hover:translate-y-0"
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    {!notification.isRead && (
                                        <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-accent" aria-hidden="true" />
                                    )}
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="rounded-ami border border-accent/25 bg-accent-soft px-3 py-1 text-xs/5 font-black text-accent">
                                            {notification.type}
                                        </span>
                                        {!notification.isRead && (
                                            <span className="inline-flex items-center gap-1.5 text-xs/5 font-black text-accent" aria-label="Нове">
                                                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                                                Нове
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-3 text-sm/6 font-bold text-text">{notification.message}</p>
                                    <div className="mt-2 text-xs/5 font-bold text-muted">
                                        <time dateTime={notification.createdAt} title={new Date(notification.createdAt).toLocaleString('uk-UA')}>
                                            {formatRelativeTime(notification.createdAt)}
                                        </time>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default NotificationPopup;
