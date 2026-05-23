import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiGet } from '../../api/client';
import { AuthContext } from '../../context/auth-context.js';
import { canUseAuthenticatedAction, createSignInRedirect } from '../../auth/guards.js';
import {
    getProtectedActionErrorMessage,
    redirectToSignInOnAuthFailure,
} from '../../auth/protectedActions.js';
import { createStatus, getErrorMessage } from '../../utils/messages.js';
import { extractCollectionPayload } from '../../utils/apiPayload.js';
import { getForumCategories } from '../../utils/forumCategories.js';
import { AmiButton, AmiContainer, AmiPanel } from '../../ui/ami.jsx';
import { cn } from '../../ui/cn.js';

function CreatePost() {
    const [title, setTitle] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [status, setStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const maxChars = 255;
    const navigate = useNavigate();
    const { isAuthenticated, loading, logout, user } = useContext(AuthContext);

    useEffect(() => {
        if (loading) return;

        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect(
                { pathname: '/create-post' },
                'Будь ласка, увійдіть для створення постів.',
            );
            navigate(redirect.to, redirect.options);
        }
    }, [isAuthenticated, loading, navigate, user]);

    useEffect(() => {
        let isCurrent = true;

        async function loadCategories() {
            try {
                setIsLoadingCategories(true);
                const payload = await apiGet('/categories/forum', { skipAuth: true });
                const forumCategories = getForumCategories(extractCollectionPayload(payload));

                if (!isCurrent) return;

                setCategories(forumCategories);
                setSelectedCategoryId((currentCategoryId) => (
                    forumCategories.some((category) => category.id === currentCategoryId)
                        ? currentCategoryId
                        : null
                ));

                if (forumCategories.length === 0) {
                    setStatus(createStatus('error', 'Категорії форуму ще не налаштовані.'));
                }
            } catch (error) {
                if (!isCurrent) return;

                console.error('Error loading forum categories:', error);
                setCategories([]);
                setSelectedCategoryId(null);
                setStatus(createStatus('error', getErrorMessage(error, 'Не вдалося завантажити категорії форуму')));
            } finally {
                if (isCurrent) setIsLoadingCategories(false);
            }
        }

        loadCategories();

        return () => {
            isCurrent = false;
        };
    }, []);

    const handleTitleChange = (event) => {
        const inputText = event.target.value;
        if (inputText.length <= maxChars) {
            setTitle(inputText);
        }
    };

    const charsLeft = maxChars - title.length;
    const charsToneClass =
        charsLeft < 30 ? 'text-amber-700 border-amber-200 bg-amber-50'
            : 'text-muted border-border bg-soft';

    const handleCategoryClick = (categoryId) => {
        setSelectedCategoryId(categoryId);
    };

    const handleAnonymousToggle = () => {
        setIsAnonymous(!isAnonymous);
    };

    const isPublishDisabled = (
        isSubmitting ||
        isLoadingCategories ||
        categories.length === 0 ||
        !title.trim() ||
        !selectedCategoryId
    );

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedCategoryId) {
            setStatus(createStatus('error', "Будь ласка, оберіть категорію."));
            return;
        }

        if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
            const redirect = createSignInRedirect(
                { pathname: '/create-post' },
                'Помилка автентифікації. Будь ласка, увійдіть знову.',
            );
            navigate(redirect.to, redirect.options);
            return;
        }

        const postData = {
            title,
            categoryId: selectedCategoryId,
            isAnonymous,
            userId: user.id,
        };

        try {
            setIsSubmitting(true);
            setStatus(null);
            await api.post('/posts', postData);
            setStatus(createStatus('success', "Пост успішно створено."));
            setTimeout(() => navigate('/forum'), 900);
        } catch (error) {
            console.error('Error creating post:', error);
            const message = await getProtectedActionErrorMessage(error, 'Помилка створення поста');
            if (redirectToSignInOnAuthFailure(error, {
                logout,
                navigate,
                location: { pathname: '/create-post' },
                message,
            })) {
                return;
            }

            setStatus(createStatus('error', getErrorMessage(error, message)));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-dvh bg-page text-ink">
            <Header />

            <AmiContainer className="grid max-w-3xl gap-6 py-6 lg:gap-8 lg:py-8">
                <Link
                    to="/forum"
                    className="inline-flex w-fit min-h-11 items-center gap-2 rounded-ami border border-border bg-white px-4 text-sm/6 font-extrabold text-ink no-underline transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-accent/40 hover:bg-soft active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) motion-reduce:active:translate-y-0"
                >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    До форуму
                </Link>

                <div>
                    <h1 className="m-0 font-sans text-3xl/10 font-black text-ink sm:text-4xl/12">
                        Створи обговорення
                    </h1>
                    <p className="m-0 mt-3 max-w-2xl text-base/7 font-bold text-muted md:text-lg/8">
                        Коротко опиши питання, обери категорію і додай деталі, щоб іншим було легше відповісти.
                    </p>
                </div>

                {status?.message && (
                    <StatusMessage type={status?.type} message={status?.message} onDismiss={() => setStatus(null)} />
                )}

                <AmiPanel className="overflow-hidden">
                    <form className="grid gap-6 p-5 sm:p-7" onSubmit={handleSubmit}>
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <label htmlFor="post-title" className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">
                                    Тема обговорення <span className="text-red-600">*</span>
                                </label>
                                <span className={cn('inline-flex items-center rounded-ami border px-2.5 py-0.5 text-xs/5 font-black tabular-nums transition-[background-color,border-color,color]', charsToneClass)}>
                                    {charsLeft}
                                </span>
                            </div>
                            <textarea
                                id="post-title"
                                rows={2}
                                placeholder="Про що твій пост?"
                                className="min-h-20 w-full resize-none rounded-ami border border-border bg-white p-4 font-sans text-xl/8 font-black text-ink outline-hidden transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-2xl/9"
                                required
                                value={title}
                                onChange={handleTitleChange}
                                maxLength={maxChars}
                                autoFocus
                            />
                        </div>

                        <div className="grid gap-3">
                            <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">
                                Категорія <span className="text-red-600">*</span>
                            </label>

                            {isLoadingCategories && (
                                <div className="flex flex-wrap gap-2" aria-busy="true">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <div key={i} className="ami-skeleton h-11 w-32 rounded-ami" />
                                    ))}
                                </div>
                            )}

                            {!isLoadingCategories && categories.length === 0 && (
                                <p className="m-0 rounded-ami border border-dashed border-border bg-soft px-4 py-4 text-sm/6 font-bold text-muted">
                                    Категорії тимчасово недоступні. Спробуй пізніше.
                                </p>
                            )}

                            {!isLoadingCategories && categories.length > 0 && (
                                <div role="radiogroup" aria-label="Категорія" className="flex flex-wrap gap-2">
                                    {categories.map((category) => {
                                        const isActive = selectedCategoryId === category.id;
                                        return (
                                            <button
                                                key={category.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={isActive}
                                                onClick={() => handleCategoryClick(category.id)}
                                                className={cn(
                                                    'inline-flex min-h-11 items-center gap-2 rounded-ami border px-4 text-sm/6 font-black transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)',
                                                    isActive
                                                        ? 'border-accent bg-accent text-white shadow-[0_2px_8px_rgb(155_77_87/0.25)]'
                                                        : 'border-border bg-white text-text hover:border-accent/40 hover:bg-accent-soft hover:text-accent-strong',
                                                )}
                                            >
                                                {isActive && (
                                                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <path d="m5 13 4 4L19 7" />
                                                    </svg>
                                                )}
                                                {category.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleAnonymousToggle}
                            aria-pressed={isAnonymous}
                            className={cn(
                                'group flex flex-col gap-4 rounded-ami border bg-white p-4 text-left transition-[background-color,border-color] duration-200 hover:border-accent/40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) sm:flex-row sm:items-center sm:justify-between',
                                isAnonymous ? 'border-accent/45 bg-accent-soft' : 'border-border',
                            )}
                        >
                            <div className="flex min-w-0 items-start gap-3">
                                <span className={cn('grid size-10 shrink-0 place-items-center rounded-ami transition', isAnonymous ? 'bg-accent text-white' : 'bg-soft text-muted')} aria-hidden="true">
                                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 11h-6M19 8v6" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="m-0 font-sans text-base/6 font-black text-ink">Опублікувати анонімно</p>
                                    <p className="m-0 mt-0.5 text-sm/6 font-bold text-muted">
                                        Автор буде прихований у стрічці обговорень.
                                    </p>
                                </div>
                            </div>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'relative h-8 w-14 shrink-0 rounded-full border transition-[background-color,border-color]',
                                    isAnonymous ? 'border-accent bg-accent' : 'border-border-strong bg-white',
                                )}
                            >
                                <span
                                    className={cn(
                                        'absolute top-1 size-6 rounded-full bg-white shadow-[0_1px_2px_rgb(15_23_42/0.18)] transition-[left,background-color] duration-200',
                                        isAnonymous ? 'left-7' : 'left-1 bg-soft',
                                    )}
                                />
                            </span>
                        </button>

                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
                            <AmiButton as={Link} to="/forum" variant="secondary" size="lg" className="no-underline max-sm:w-full">
                                Скасувати
                            </AmiButton>
                            <AmiButton type="submit" size="lg" loading={isSubmitting} disabled={isPublishDisabled && !isSubmitting} className="max-sm:w-full">
                                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m4 12 16-8-6 18-3-7-7-3Z" />
                                </svg>
                                Опублікувати
                            </AmiButton>
                        </div>
                    </form>
                </AmiPanel>
            </AmiContainer>

            <Footer />
        </div>
    );
}

export default CreatePost;
