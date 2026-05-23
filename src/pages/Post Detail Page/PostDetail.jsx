import { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import anonymousAvatar from '../../assets/images/anonymous.jpg';
import { AuthContext } from '../../context/auth-context.js';
import { canUseAuthenticatedAction, createSignInRedirect } from '../../auth/guards.js';
import {
    getProtectedActionErrorMessage,
    redirectToSignInOnAuthFailure,
} from '../../auth/protectedActions.js';
import Comment from '../../components/Comment/Comment';
import NotFound from '../../components/Errors/NotFound/NotFound';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { apiFetch } from '../../api/client';
import { createStatus, getErrorMessage } from '../../utils/messages.js';
import { formatCommentCount } from '../../utils/commentText.js';
import { addCommentToTop, removeComment, replaceComment } from '../../utils/commentList.js';
import { AmiButton, AmiContainer, AmiPanel } from '../../ui/ami.jsx';
import { cn } from '../../ui/cn.js';
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation';

const COMMENT_MAX_LENGTH = 1200;

function PostDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, logout, user } = useContext(AuthContext);

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [postStatus, setPostStatus] = useState(null);
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isSavingPost, setIsSavingPost] = useState(false);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [commentError, setCommentError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [savingCommentId, setSavingCommentId] = useState(null);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const postLocation = { pathname: `/forum/post/${slug}` };

    const redirectOnAuthFailure = (source, message) => redirectToSignInOnAuthFailure(source, {
        logout,
        navigate,
        location: postLocation,
        message,
    });

    const fetchComments = useCallback(async (postId) => {
        if (!postId) return;
        try {
            const response = await apiFetch(`/comments/post/${postId}?size=1000&sort=createdAt,desc`);
            if (!response.ok) throw new Error('Не вдалося завантажити коментарі');
            const data = await response.json();
            setComments(data.content || []);
        } catch (err) {
            console.error("Error fetching comments:", err);
            setCommentError(getErrorMessage(err, 'Не вдалося завантажити коментарі'));
        }
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const canRefreshComments =
                post?.id &&
                !newComment.trim() &&
                !submittingComment &&
                !savingCommentId &&
                !deletingCommentId &&
                !isEditingPost;

            if (canRefreshComments) {
                fetchComments(post.id);
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, [post?.id, fetchComments, newComment, submittingComment, savingCommentId, deletingCommentId, isEditingPost]);

    useEffect(() => {
        if (!slug) return;

        async function fetchPostData() {
            try {
                const response = await apiFetch(`/posts/slug/${slug}`);
                if (!response.ok) {
                    throw new Error('Post not found');
                }

                const data = await response.json();
                setPost(data);
                setLikes(data.likes || 0);
                setEditedTitle(data.title || '');
                setPostStatus(null);

                if (data?.id) {
                    await fetchComments(data.id);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchPostData();
    }, [slug, fetchComments]);

    useEffect(() => {
        let isCurrent = true;

        async function checkLikeStatus() {
            if (!post?.id || !isAuthenticated || !user?.id) {
                setIsLiked(false);
                return;
            }

            try {
                const response = await apiFetch(`/posts/${post.id}/likes/check?userId=${user.id}`);

                if (response.ok && isCurrent) {
                    const hasLiked = await response.json();
                    setIsLiked(hasLiked);
                }
            } catch (err) {
                console.error("Error checking like status:", err);
            }
        }

        checkLikeStatus();

        return () => {
            isCurrent = false;
        };
    }, [post?.id, isAuthenticated, user?.id]);

    function getRelativeTime(dateStr) {
        if (!dateStr) return 'Невідомий час';

        const postDate = new Date(dateStr);
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
        } else if (weeks == 1) {
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

    function handleCommentChange(e) {
        setNewComment(e.target.value);
        if (commentError) {
            setCommentError(null);
        }
    }

    async function handleSubmitComment(e) {
        e.preventDefault();

        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect(
                { pathname: `/forum/post/${slug}` },
                'Увійдіть, щоб залишити коментар.',
            );
            navigate(redirect.to, redirect.options);
            return;
        }

        const trimmedComment = newComment.trim();
        if (!trimmedComment) return;

        setSubmittingComment(true);
        setCommentError(null);

        try {
            const commentData = {
                content: trimmedComment,
                postId: post.id,
                userId: user.id,
            };

            const response = await apiFetch('/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(commentData),
            });

            if (!response.ok) {
                const message = await getProtectedActionErrorMessage(response, 'Не вдалося додати коментар');
                if (redirectOnAuthFailure(response, message)) {
                    return;
                }

                throw new Error(message);
            }

            const createdComment = await response.json();

            setNewComment('');
            if (createdComment?.id) {
                setComments((currentComments) => addCommentToTop(currentComments, createdComment));
            } else {
                await fetchComments(post.id);
            }
        } catch (err) {
            console.error("Error posting comment:", err);
            setCommentError(getErrorMessage(err, 'Не вдалося додати коментар'));
        } finally {
            setSubmittingComment(false);
        }
    }

    const handleEditComment = async (commentId, newContent) => {
        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect(
                { pathname: `/forum/post/${slug}` },
                'Увійдіть, щоб редагувати коментар.',
            );
            navigate(redirect.to, redirect.options);
            return;
        }

        setSavingCommentId(commentId);
        setCommentError(null);

        try {
            const response = await apiFetch(`/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newContent }),
            });

            if (!response.ok) {
                const message = await getProtectedActionErrorMessage(response, 'Не вдалося оновити коментар');
                if (redirectOnAuthFailure(response, message)) {
                    return;
                }

                throw new Error(message);
            }

            const updatedComment = await response.json();
            if (updatedComment?.id) {
                setComments((currentComments) => replaceComment(currentComments, updatedComment));
            } else if (post?.id) {
                await fetchComments(post.id);
            }
        } catch (err) {
            console.error("Error editing comment:", err);
            setCommentError(getErrorMessage(err, 'Не вдалося оновити коментар'));
            throw err;
        } finally {
            setSavingCommentId(null);
        }
    };

    const handleDeleteComment = async (commentId, reason, notificationType) => {
        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect(
                { pathname: `/forum/post/${slug}` },
                'Увійдіть, щоб видаляти коментарі.',
            );
            navigate(redirect.to, redirect.options);
            return;
        }

        setDeletingCommentId(commentId);
        setCommentError(null);

        try {
            let deleteUrl = `/comments/${commentId}`;
            deleteUrl += `?reason=${encodeURIComponent(reason)}&notificationType=${encodeURIComponent(notificationType)}`;

            const response = await apiFetch(deleteUrl, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const message = await getProtectedActionErrorMessage(response, 'Не вдалося видалити коментар');
                if (redirectOnAuthFailure(response, message)) {
                    return;
                }

                throw new Error(message);
            }

            setComments((currentComments) => removeComment(currentComments, commentId));
        } catch (err) {
            console.error("Error deleting comment:", err);
            setCommentError(getErrorMessage(err, 'Не вдалося видалити коментар'));
            throw err;
        } finally {
            setDeletingCommentId(null);
        }
    };

    const handleLikeToggle = async () => {
        if (!post?.id || isLikeLoading) return;

        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect(
                { pathname: `/forum/post/${slug}` },
                'Увійдіть, щоб вподобати пост.',
            );
            navigate(redirect.to, redirect.options);
            return;
        }

        setIsLikeLoading(true);
        setPostStatus(null);

        try {
            const response = await apiFetch(`/posts/${post.id}/${isLiked ? 'unlike' : 'like'}?userId=${user.id}`, {
                method: 'POST',
            });

            if (!response.ok) {
                const message = await getProtectedActionErrorMessage(response, 'Не вдалося оновити вподобайку');
                if (redirectOnAuthFailure(response, message)) {
                    return;
                }

                throw new Error(message);
            }

            const updatedPost = await response.json();
            setLikes(updatedPost.likes || 0);
            setPost((currentPost) => currentPost ? { ...currentPost, ...updatedPost } : updatedPost);
            setIsLiked((currentValue) => !currentValue);
        } catch (err) {
            console.error("Error toggling like:", err);
            setPostStatus(createStatus('error', getErrorMessage(err, 'Не вдалося оновити вподобайку')));
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleStartPostEdit = () => {
        setEditedTitle(post.title || '');
        setPostStatus(null);
        setIsEditingPost(true);
    };

    const handleCancelPostEdit = () => {
        setEditedTitle(post.title || '');
        setIsEditingPost(false);
        setPostStatus(null);
    };

    const handleSavePostTitle = async (e) => {
        e.preventDefault();

        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect(
                { pathname: `/forum/post/${slug}` },
                'Увійдіть, щоб редагувати пост.',
            );
            navigate(redirect.to, redirect.options);
            return;
        }

        const trimmedTitle = editedTitle.trim();

        if (!trimmedTitle) {
            setPostStatus(createStatus('error', 'Назва поста не може бути порожньою.'));
            return;
        }

        if (trimmedTitle === post.title) {
            setIsEditingPost(false);
            return;
        }

        setIsSavingPost(true);
        setPostStatus(null);

        try {
            const response = await apiFetch(`/posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: trimmedTitle }),
            });

            if (!response.ok) {
                const message = await getProtectedActionErrorMessage(response, 'Не вдалося оновити назву поста');
                if (redirectOnAuthFailure(response, message)) {
                    return;
                }

                throw new Error(message);
            }

            const updatedPost = await response.json();
            const nextTitle = updatedPost.title || trimmedTitle;

            setPost((currentPost) => currentPost ? {
                ...currentPost,
                ...updatedPost,
                title: nextTitle,
                slug: currentPost.slug || updatedPost.slug,
            } : updatedPost);
            setEditedTitle(nextTitle);
            setIsEditingPost(false);
            setPostStatus(createStatus('success', 'Назву поста оновлено.'));
        } catch (err) {
            console.error("Error editing post:", err);
            setPostStatus(createStatus('error', getErrorMessage(err, 'Не вдалося оновити назву поста')));
        } finally {
            setIsSavingPost(false);
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleDeletePost = async () => {
        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect(
                { pathname: `/forum/post/${slug}` },
                'Увійдіть, щоб видалити пост.',
            );
            navigate(redirect.to, redirect.options);
            return;
        }

        // open modal for confirmation and optional reason
        setDeleteModalOpen(true);
    };

    const performDeletePost = async ({ reason, notificationType }) => {
        setDeleteModalOpen(false);
        setIsDeletingPost(true);
        setPostStatus(null);

        try {
            let deleteUrl = `/posts/${post.id}`;
            deleteUrl += `?reason=${encodeURIComponent(reason)}&notificationType=${encodeURIComponent(notificationType)}`;

            const response = await apiFetch(deleteUrl, { method: 'DELETE' });

            if (!response.ok) {
                const message = await getProtectedActionErrorMessage(response, 'Не вдалося видалити пост');
                if (redirectOnAuthFailure(response, message)) return;
                throw new Error(message);
            }

            navigate('/forum');
        } catch (err) {
            console.error("Error deleting post:", err);
            setPostStatus(createStatus('error', getErrorMessage(err, 'Не вдалося видалити пост')));
        } finally {
            setIsDeletingPost(false);
        }
    };

    if (loading) return (
        <div className="min-h-dvh bg-page text-ink">
            <Header />
            <AmiContainer className="grid max-w-4xl gap-6 py-8">
                <div className="ami-skeleton h-10 w-32 rounded-ami" />
                <AmiPanel className="grid gap-5 p-6 sm:p-8">
                    <div className="flex items-center gap-4 border-b border-border pb-5">
                        <div className="ami-skeleton size-14 rounded-full" />
                        <div className="grid flex-1 gap-2">
                            <div className="ami-skeleton h-5 w-40" />
                            <div className="ami-skeleton h-4 w-24" />
                        </div>
                    </div>
                    <div className="ami-skeleton h-7 w-24 rounded-ami" />
                    <div className="ami-skeleton h-12 w-3/4" />
                    <div className="grid gap-2">
                        <div className="ami-skeleton h-4 w-full" />
                        <div className="ami-skeleton h-4 w-11/12" />
                        <div className="ami-skeleton h-4 w-2/3" />
                    </div>
                </AmiPanel>
            </AmiContainer>
            <Footer />
        </div>
    );

    if (error || !post) return <NotFound />;

    const userName = post.isAnonymous
        ? 'Анонім'
        : (post.userResponse?.firstName && post.userResponse?.lastName)
            ? `${post.userResponse.firstName} ${post.userResponse.lastName}`
            : (post.userResponse?.firstName || post.userResponse?.lastName)
                ? `${post.userResponse?.firstName || ''} ${post.userResponse?.lastName || ''}`.trim()
                : 'Анонім';

    const categoryName = post.categoryResponse?.name || 'Без категорії';
    const postTime = getRelativeTime(post.createdAt);
    const commentCountText = formatCommentCount(comments.length);
    const isOwnPost = user && post.userResponse && String(user.id) === String(post.userResponse.id);
    const charsRemaining = COMMENT_MAX_LENGTH - newComment.length;
    const counterTone =
        charsRemaining < 0 ? 'text-red-700'
            : charsRemaining < 100 ? 'text-amber-700'
                : 'text-muted';

    return (
        <div className="min-h-dvh bg-page text-ink">
            <Header />

            <AmiContainer className="grid max-w-4xl gap-6 py-6 lg:gap-8 lg:py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        to="/forum"
                        className="inline-flex min-h-11 items-center gap-2 rounded-ami border border-border bg-white px-4 text-sm/6 font-extrabold text-ink no-underline transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-accent/40 hover:bg-soft active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) motion-reduce:active:translate-y-0"
                    >
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        До форуму
                    </Link>
                </div>

                <article>
                    <AmiPanel className="overflow-hidden p-5 sm:p-8">
                        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                                <img
                                    className={cn(
                                        'size-14 shrink-0 rounded-full border-2 border-white object-cover sm:size-16',
                                        post.isAnonymous && 'grayscale',
                                    )}
                                    src={post.isAnonymous ? anonymousAvatar : (post.userResponse?.avatarLink || anonymousAvatar)}
                                    alt="аватар"
                                />
                                <div className="min-w-0 grid gap-1">
                                    <span className="font-sans text-lg/6 font-black text-ink sm:text-xl/7">{userName}</span>
                                    <span className="text-xs/5 font-extrabold text-muted sm:text-sm/6">
                                        <time dateTime={post.createdAt} title={post.createdAt ? new Date(post.createdAt).toLocaleString('uk-UA') : undefined}>
                                            {postTime}
                                        </time>
                                        {isOwnPost && (
                                            <span className="ml-2 inline-flex items-center rounded-ami border border-accent/30 bg-accent-soft px-2 py-0.5 text-[10px]/4 font-black text-accent-strong">
                                                автор — це ти
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {(isOwnPost || user?.role === 'ROLE_ADMIN') && !isEditingPost && (
                                <div className="flex flex-wrap gap-2" aria-label="Дії з постом">
                                    {isOwnPost && (
                                        <AmiButton
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleStartPostEdit}
                                            disabled={isSavingPost || isDeletingPost}
                                        >
                                            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                                        </svg>
                                        Редагувати
                                    </AmiButton>
                                    )}
                                    <AmiButton
                                        variant="danger"
                                        size="sm"
                                        onClick={handleDeletePost}
                                        loading={isDeletingPost}
                                        disabled={isSavingPost}
                                    >
                                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        </svg>
                                        Видалити
                                    </AmiButton>
                                </div>
                            )}
                        </header>

                        <div className="mt-6">
                            <Link
                                to={`/forum?category=${encodeURIComponent(categoryName)}`}
                                className="inline-flex items-center gap-1.5 rounded-ami border border-accent/30 bg-accent-soft px-3 py-1 text-xs/5 font-black text-accent-strong no-underline transition hover:border-accent/50 hover:bg-accent hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                            >
                                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.58a2 2 0 0 1 0 2.83Z" />
                                    <circle cx="7" cy="7" r="1.5" fill="currentColor" />
                                </svg>
                                {categoryName}
                            </Link>
                        </div>

                        {isEditingPost ? (
                            <form className="mt-4 grid gap-4" onSubmit={handleSavePostTitle}>
                                <textarea
                                    rows={2}
                                    className="min-h-16 w-full resize-none rounded-ami border border-border bg-white p-4 font-sans text-2xl/9 font-black text-ink outline-hidden transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-3xl/10"
                                    value={editedTitle}
                                    onChange={(event) => {
                                        setEditedTitle(event.target.value);
                                        if (postStatus) setPostStatus(null);
                                    }}
                                    disabled={isSavingPost || isDeletingPost}
                                    maxLength={160}
                                    placeholder="Назва поста..."
                                    autoFocus
                                />
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-xs/5 font-bold text-muted">{editedTitle.length}/160</span>
                                    <div className="flex flex-wrap gap-2">
                                        <AmiButton
                                            variant="secondary"
                                            onClick={handleCancelPostEdit}
                                            disabled={isSavingPost || isDeletingPost}
                                            type="button"
                                        >
                                            Скасувати
                                        </AmiButton>
                                        <AmiButton
                                            type="submit"
                                            loading={isSavingPost}
                                            disabled={isDeletingPost || !editedTitle.trim() || editedTitle.trim() === post.title}
                                        >
                                            Зберегти
                                        </AmiButton>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <h1 className="m-0 mt-4 max-w-4xl font-sans text-3xl/10 font-black text-ink sm:text-4xl/12">
                                {post.title}
                            </h1>
                        )}

                        {postStatus?.message && (
                            <div className="mt-5">
                                <StatusMessage type={postStatus.type} message={postStatus.message} onDismiss={() => setPostStatus(null)} />
                            </div>
                        )}

                        {post.content && (
                            <div className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap text-base/8 font-bold text-text sm:text-lg/8">
                                {post.content}
                            </div>
                        )}

                        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                            <button
                                type="button"
                                onClick={handleLikeToggle}
                                disabled={isLikeLoading}
                                aria-pressed={isLiked}
                                aria-label={isLiked ? 'Забрати вподобайку' : 'Вподобати'}
                                title={isAuthenticated ? (isLiked ? 'Забрати вподобайку' : 'Вподобати') : 'Увійдіть, щоб вподобати'}
                                className={cn(
                                    'inline-flex min-h-11 items-center gap-2 rounded-ami border px-4 text-sm/6 font-extrabold transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) disabled:cursor-not-allowed disabled:opacity-60',
                                    isLiked
                                        ? 'border-accent bg-accent text-white hover:border-accent-strong hover:bg-accent-strong'
                                        : 'border-border bg-white text-ink hover:border-accent hover:bg-accent-soft hover:text-accent-strong',
                                    'active:scale-95 motion-reduce:active:scale-100',
                                )}
                            >
                                <svg className={cn('size-5 transition-transform duration-200', isLiked && 'scale-110')} viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3 9.24 3 10.91 3.81 12 5.08 13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53Z"
                                        fill={isLiked ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                </svg>
                                <span>{likes}</span>
                                <span className="hidden sm:inline">{likes === 1 ? 'вподобайка' : likes >= 2 && likes <= 4 ? 'вподобайки' : 'вподобайок'}</span>
                            </button>

                            <a
                                href="#comments"
                                className="inline-flex min-h-11 items-center gap-2 rounded-ami border border-border bg-white px-4 text-sm/6 font-extrabold text-ink no-underline transition hover:border-accent/40 hover:bg-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                            >
                                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                                </svg>
                                <span>{commentCountText}</span>
                            </a>
                        </div>
                    </AmiPanel>
                </article>

                <section id="comments" className="scroll-mt-20">
                    <AmiPanel className="overflow-hidden p-5 sm:p-8">
                        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
                            <div className="min-w-0">
                                <h2 className="m-0 font-sans text-2xl/9 font-black text-ink sm:text-3xl/10">Коментарі</h2>
                                <p className="m-0 mt-1 max-w-xl text-sm/6 font-bold text-muted sm:text-base/7">
                                    Пиши по суті, додавай контекст і поважай чужий час.
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-ami border border-accent/30 bg-accent-soft px-3 py-1.5 text-sm/6 font-black text-accent-strong">
                                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                                </svg>
                                {commentCountText}
                            </span>
                        </div>

                        <form className="mt-5 grid gap-3" onSubmit={handleSubmitComment}>
                            {commentError && (
                                <StatusMessage type="error" message={commentError} onDismiss={() => setCommentError(null)} />
                            )}
                            <div className="flex items-start gap-3">
                                <img
                                    src={user?.avatarLink || anonymousAvatar}
                                    alt=""
                                    aria-hidden="true"
                                    className="hidden size-10 shrink-0 rounded-full border-2 border-white object-cover sm:block"
                                />
                                <div className="min-w-0 flex-1">
                                    <label htmlFor="post-comment" className="sr-only">Ваш коментар</label>
                                    <textarea
                                        id="post-comment"
                                        className="min-h-32 w-full resize-y rounded-ami border border-border bg-white px-4 py-3 text-base/7 font-bold text-ink outline-hidden transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                                        placeholder={isAuthenticated ? 'Напишіть коментар...' : 'Увійдіть, щоб залишити коментар'}
                                        value={newComment}
                                        onChange={handleCommentChange}
                                        disabled={!isAuthenticated || submittingComment}
                                        maxLength={COMMENT_MAX_LENGTH}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className={cn('text-xs/5 font-extrabold tabular-nums', counterTone)}>
                                    {newComment.length}/{COMMENT_MAX_LENGTH}
                                </span>
                                <div className="flex flex-wrap items-center gap-3">
                                    {!isAuthenticated && (
                                        <Link
                                            to="/signin"
                                            className="text-sm/6 font-extrabold text-accent-strong underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                                        >
                                            Увійти
                                        </Link>
                                    )}
                                    <AmiButton
                                        type="submit"
                                        loading={submittingComment}
                                        disabled={!isAuthenticated || !newComment.trim()}
                                    >
                                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="m4 12 16-8-6 18-3-7-7-3Z" />
                                        </svg>
                                        Надіслати
                                    </AmiButton>
                                </div>
                            </div>
                        </form>

                        <div className="mt-6 grid gap-3">
                            {comments.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 rounded-ami border border-dashed border-border bg-soft px-5 py-10 text-center">
                                    <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                                        </svg>
                                    </span>
                                    <div>
                                        <h3 className="m-0 font-sans text-base/7 font-black text-ink">Поки що тиша</h3>
                                        <p className="m-0 mt-1 text-sm/6 font-bold text-muted">Стань першим, хто відгукнеться.</p>
                                    </div>
                                </div>
                            ) : (
                                comments.map((comment) => {
                                    if (!comment || !comment.id) {
                                        console.warn('Invalid comment data:', comment);
                                        return null;
                                    }

                                    const commentUserName =
                                        (comment.userResponse?.firstName && comment.userResponse?.lastName)
                                            ? `${comment.userResponse.firstName} ${comment.userResponse.lastName}`
                                            : (comment.user?.firstName && comment.user?.lastName)
                                                ? `${comment.user.firstName} ${comment.user.lastName}`
                                                : (comment.userFirstName || comment.userLastName)
                                                    ? `${comment.userFirstName || ''} ${comment.userLastName || ''}`.trim()
                                                    : comment.userName || comment.username || 'Користувач';

                                    const commentAvatar =
                                        comment.userResponse?.avatarLink ||
                                        comment.user?.avatarLink ||
                                        comment.userAvatarLink ||
                                        comment.avatarLink ||
                                        anonymousAvatar;

                                    const isOwnComment = user && comment.userResponse && String(user.id) === String(comment.userResponse.id);

                                    return (
                                        <Comment
                                            key={comment.id}
                                            commentId={comment.id}
                                            authorAvatar={commentAvatar}
                                            author={commentUserName}
                                            creationDate={getRelativeTime(comment.createdAt)}
                                            commentContent={comment.content}
                                            isOwnComment={isOwnComment}
                                            isSaving={savingCommentId === comment.id}
                                            isDeleting={deletingCommentId === comment.id}
                                            onEdit={handleEditComment}
                                            onDelete={handleDeleteComment}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </AmiPanel>
                </section>
            </AmiContainer>
            <Footer />
            <DeleteConfirmation
                open={deleteModalOpen}
                title="Підтвердження видалення"
                message="Вкажіть обов'язкову причину видалення та виберіть тип сповіщення для користувача."
                onCancel={() => setDeleteModalOpen(false)}
                onConfirm={(payload) => performDeletePost(payload)}
            />
        </div>
    );
}

export default PostDetail;
