import anonymousAvatar from "../../assets/images/anonymous.jpg";
import PropTypes from 'prop-types'; 
import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context.js';
import { canUseAuthenticatedAction, createSignInRedirect } from '../../auth/guards.js';
import {
    getProtectedActionErrorMessage,
    redirectToSignInOnAuthFailure,
} from '../../auth/protectedActions.js';
import StatusMessage from '../StatusMessage/StatusMessage';
import { apiFetch } from '../../api/client';
import { createStatus, getErrorMessage } from '../../utils/messages.js';
import { formatCommentCount } from '../../utils/commentText.js';
import { cn } from '../../ui/cn.js';
import DeleteConfirmation from '../DeleteConfirmation/DeleteConfirmation';

function Post({
    id,
    slug,
    title,
    likes: initialLikes,
    createdAt,
    categoryResponse,
    userResponse,
    isAnonymous,
    onDeleted,
    onUpdated,
}) {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useContext(AuthContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const [likes, setLikes] = useState(initialLikes || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionStatus, setActionStatus] = useState(null);
    const dropdownRef = useRef(null);
    const isCurrentUserPost = user && userResponse && String(user.id) === String(userResponse.id);
    const detailPath = slug ? `/post/${slug}` : `/post/${id}`;

    useEffect(() => {
        setLikes(initialLikes || 0);
    }, [initialLikes]);
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        async function checkLikeStatus() {
            if (!isAuthenticated || !user?.id) {
                setIsLiked(false);
                return;
            }

            try {
                const response = await apiFetch(`/posts/${id}/likes/check?userId=${user.id}`);
                if (response.ok) {
                    const hasLiked = await response.json();
                    setIsLiked(hasLiked);
                }
            } catch (error) {
                console.error('Error checking like status:', error);
            }
        }

        checkLikeStatus();
    }, [id, user?.id, isAuthenticated]);

    const handleLikeToggle = async (e) => {
        e.stopPropagation();

        if (isLikeLoading) {
            return;
        }

        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect({ pathname: detailPath }, 'Увійдіть, щоб вподобати пост.');
            navigate(redirect.to, redirect.options);
            return;
        }

        setIsLikeLoading(true);
        setActionStatus(null);

        try {
            const response = await apiFetch(`/posts/${id}/${isLiked ? 'unlike' : 'like'}?userId=${user.id}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const message = await getProtectedActionErrorMessage(response, 'Не вдалося оновити вподобайку');
                if (redirectToSignInOnAuthFailure(response, {
                    logout,
                    navigate,
                    location: { pathname: detailPath },
                    message,
                })) {
                    return;
                }

                throw new Error(message);
            }

            const updatedPost = await response.json();
            setLikes(updatedPost.likes || 0);
            setIsLiked((currentValue) => !currentValue);
            onUpdated?.(updatedPost);
        } catch (error) {
            console.error('Error toggling like:', error);
            setActionStatus(createStatus('error', getErrorMessage(error, 'Не вдалося оновити вподобайку')));
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleDeletePost = async (e) => {
        e.stopPropagation();
        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect({ pathname: detailPath }, 'Увійдіть, щоб керувати постом.');
            navigate(redirect.to, redirect.options);
            return;
        }
        setShowDropdown(false);
        setShowDeleteModal(true);
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const performDelete = async ({ reason, notificationType }) => {
        setIsDeleting(true);
        setShowDeleteModal(false);
        let deletedFromFeed = false;
        try {
            setActionStatus(null);
            let deleteUrl = `/posts/${id}`;
            deleteUrl += `?reason=${encodeURIComponent(reason)}&notificationType=${encodeURIComponent(notificationType)}`;

            const response = await apiFetch(deleteUrl, { method: 'DELETE' });

            if (response.ok) {
                deletedFromFeed = Boolean(onDeleted);
                onDeleted?.(id);
            } else {
                const message = await getProtectedActionErrorMessage(response, 'Не вдалося видалити пост');
                if (redirectToSignInOnAuthFailure(response, {
                    logout,
                    navigate,
                    location: { pathname: detailPath },
                    message,
                })) return;

                setActionStatus(createStatus('error', message));
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            setActionStatus(createStatus('error', getErrorMessage(error, 'Помилка при видаленні поста')));
        } finally {
            if (!deletedFromFeed) setIsDeleting(false);
        }
    };

    const toggleDropdown = (e) => {
        e.stopPropagation();
        if (isDeleting) {
            return;
        }
        setShowDropdown(!showDropdown);
    };

    function getRelativeTime(postDateStr) {
        if (!postDateStr) return 'Невідомий час';
        
        const postDate = new Date(postDateStr);
        const now = new Date();
        const diffMs = now - postDate;
    
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(weeks / 4);
        const years = Math.floor(months / 12);
    
        if (years > 0) {
            return `${years} рік${years > 1 ? 'и' : ''} тому`;
        } else if (months > 4) {
            return `${months} місяців тому`;
        } else if (months >= 2) {
            return `${months} місяці тому`;
        } else if (months === 1) {
            return 'місяць тому';
        } else if (weeks >= 2) {
            return `${weeks} тижні тому`;
        } else if (weeks == 1 ) {
            return 'тиждень тому';
        } else if (days >= 5) {
            return `${days} днів тому`;
        } else if (days >= 2 && days < 5) {
            return `${days} дні тому`;
        } else if (days === 1) {
            return 'учора';
        } else if (hours >= 1) {
            return `${hours} год тому`;
        } else if (minutes >= 1) {
            return `${minutes} хв тому`;
        } else {
            return 'щойно';
        }
    }
    const [commentCount, setCommentCount] = useState(0);

    useEffect(() => {
        async function fetchCommentCount() {
            try {
                const response = await apiFetch(`/comments/post/${id}/count`);
                const count = await response.json();
                setCommentCount(count);
            } catch (error) {
                console.error("Failed to fetch comment count:", error);
            }
        }

        if (id) {
            fetchCommentCount();
        }
    }, [id]);

    const navigateToPostDetail = () => {
        if (slug) {
            navigate(`/forum/post/${slug}`);
        } else {
            navigate(`/forum/post/${id}`);
        }
    };

    const postTime = createdAt ? getRelativeTime(createdAt) : 'Невідомий час';
    const userFirstName = userResponse?.firstName || 'Анонім';
    const userLastName = userResponse?.lastName || 'Анонім';
    const userName = isAnonymous 
                       ? 'Анонім'
                       : (userResponse?.firstName && userResponse?.lastName) 
                           ? `${userResponse.firstName} ${userResponse.lastName}` 
                           : (userFirstName !== 'Анонім' || userLastName !== 'Анонім') 
                               ? `${userFirstName} ${userLastName}`.trim()
                               : 'Анонім'; 
    const categoryName = categoryResponse?.name ? categoryResponse.name : 'Без категорії';

    return (
        <>
        <article
            key={id}
            className="group relative m-3 grid cursor-pointer gap-4 rounded-ami border border-border bg-white px-4 py-4 shadow-[var(--shadow-ami-xs)] transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-accent/35 hover:shadow-[var(--shadow-ami-sm)] focus-within:border-accent/35 focus-within:shadow-[var(--shadow-ami-sm)] motion-reduce:hover:translate-y-0 sm:px-5 sm:py-5"
            onClick={navigateToPostDetail}
        >
            <div className="flex min-w-0 items-start gap-4">
                <img
                    className={cn(
                        "size-12 shrink-0 rounded-full border-2 border-white object-cover shadow-[var(--shadow-ami-xs)] ring-1 ring-border/60",
                        isAnonymous && "grayscale",
                    )}
                    src={isAnonymous ? anonymousAvatar : (userResponse?.avatarLink || anonymousAvatar)}
                    alt="аватар"
                    height="48"
                    width="48"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs/5 font-extrabold text-muted">
                        <Link
                            to={`/forum?category=${encodeURIComponent(categoryName)}`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center rounded-ami border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[11px]/4 font-black text-accent-strong no-underline transition hover:border-accent/55 hover:bg-accent hover:text-white"
                        >
                            {categoryName}
                        </Link>
                        <span className="text-ink">{userName}</span>
                        <span className="size-1 rounded-full bg-border-strong" aria-hidden="true" />
                        <time dateTime={createdAt} title={createdAt ? new Date(createdAt).toLocaleString('uk-UA') : undefined}>
                            {postTime}
                        </time>
                    </div>

                    <h2 className="m-0 mt-2 max-w-4xl font-sans text-lg/7 font-black text-ink transition-colors duration-200 group-hover:text-accent-strong sm:text-xl/8">
                        {title}
                    </h2>

                    <footer className="mt-3 flex flex-wrap items-center gap-2 text-sm/6 font-extrabold text-muted">
                        <button
                            type="button"
                            className={cn(
                                "inline-flex min-h-9 items-center gap-1.5 rounded-ami border px-3 text-sm/6 font-black transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:active:scale-100 active:scale-95",
                                isLiked
                                    ? "border-rose-200 bg-rose-50 text-rose-600"
                                    : "border-border bg-soft text-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
                            )}
                            onClick={handleLikeToggle}
                            disabled={isLikeLoading}
                            aria-pressed={isLiked}
                            aria-label={isLiked ? 'Забрати вподобайку' : 'Вподобати'}
                            title={isAuthenticated ? (isLiked ? 'Забрати вподобайку' : 'Вподобати') : 'Увійдіть, щоб вподобати'}
                        >
                            <svg
                                className={cn("size-4 transition-transform duration-200", isLiked && "scale-110")}
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3 9.24 3 10.91 3.81 12 5.08 13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53Z"
                                    fill={isLiked ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                            <span className="tabular-nums">{likes}</span>
                        </button>

                        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-ami border border-border bg-soft px-3 text-sm/6 font-black text-muted">
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                            </svg>
                            <span className="tabular-nums">{commentCount}</span>
                            <span className="hidden sm:inline">{formatCommentCount(commentCount).replace(/^\d+\s*/, '')}</span>
                        </span>
                    </footer>
                </div>

                {(isCurrentUserPost || user?.role === 'ROLE_ADMIN') && (
                    <div className="relative shrink-0" ref={dropdownRef}>
                        <button
                            type="button"
                            className={cn(
                                "grid size-9 place-items-center rounded-ami border border-transparent bg-transparent text-muted transition duration-200 hover:border-border hover:bg-soft hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) disabled:cursor-not-allowed disabled:opacity-60",
                                showDropdown && "border-accent/30 bg-accent text-white hover:border-accent/30 hover:bg-accent hover:text-white",
                            )}
                            onClick={toggleDropdown}
                            aria-haspopup="menu"
                            aria-label="Дії з постом"
                            aria-expanded={showDropdown}
                            disabled={isDeleting}
                        >
                            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <circle cx="12" cy="5" r="1.6" />
                                <circle cx="12" cy="12" r="1.6" />
                                <circle cx="12" cy="19" r="1.6" />
                            </svg>
                        </button>

                        {showDropdown && (
                            <div
                                role="menu"
                                className="ami-elevated ami-popover-motion absolute right-0 top-full z-20 mt-2 min-w-44 overflow-hidden rounded-ami border border-border bg-white"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleDeletePost}
                                    className="inline-flex min-h-11 w-full items-center gap-2 border-0 bg-transparent px-4 text-left text-sm/6 font-black text-red-700 transition duration-200 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <span className="inline-block size-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent" aria-hidden="true" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                                        </svg>
                                    )}
                                    {isDeleting ? 'Видаляємо…' : 'Видалити пост'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {actionStatus && (
                <div className="ml-16" onClick={(event) => event.stopPropagation()}>
                    <StatusMessage type={actionStatus?.type} message={actionStatus?.message} />
                </div>
            )}
        </article>
        <DeleteConfirmation
            open={showDeleteModal}
            title="Підтвердження видалення"
            message="Вкажіть обов'язкову причину видалення та виберіть тип сповіщення для користувача."
            onCancel={() => setShowDeleteModal(false)}
            onConfirm={(payload) => performDelete(payload)}
        />
        </>
    );
}

Post.propTypes = {
    id: PropTypes.number.isRequired,
    slug: PropTypes.string,
    title: PropTypes.string.isRequired,
    content: PropTypes.string,
    likes: PropTypes.number,
    createdAt: PropTypes.string,
    isAnonymous: PropTypes.bool,
    categoryResponse: PropTypes.shape({
        name: PropTypes.string
    }),
    comments: PropTypes.array,
    userResponse: PropTypes.shape({
        id: PropTypes.number,
        lastName: PropTypes.string,
        firstName: PropTypes.string,
        avatarLink: PropTypes.string
    }),
    onDeleted: PropTypes.func,
    onUpdated: PropTypes.func,
};

export default Post;
