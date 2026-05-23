import Header from "../../components/Header/Header";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Post from "../../components/Post/Post";
import Footer from "../../components/Footer/Footer";
import StatusMessage from "../../components/StatusMessage/StatusMessage";
import { apiFetch, apiGet } from "../../api/client";
import { extractCollectionPayload } from "../../utils/apiPayload";
import { FORUM_CATEGORY_NAMES, getForumCategoryNames } from "../../utils/forumCategories";
import { removePostFromFeed, updatePostInFeed } from "../../utils/postFeed";
import { AmiButton, AmiContainer, AmiPanel } from "../../ui/ami.jsx";
import { cn } from "../../ui/cn.js";
import Fuse from 'fuse.js/dist/fuse.esm.js';

const POSTS_PER_PAGE = 10;
const SORT_FILTERS = ['Популярні', 'Нові', 'Старі'];
const FORUM_GUIDE_ITEMS = [
    {
        title: 'Дописи студентів',
        description: 'Запитання, поради й короткі обговорення без зайвої офіційності.',
    },
    {
        title: 'Теми',
        description: 'Навчання, події, FAQ та інші розділи для швидкої навігації.',
    },
    {
        title: 'Пошук',
        description: 'Допомагає знайти потрібний пост у поточній стрічці.',
    },
];

function Forum() {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [categoryFilters, setCategoryFilters] = useState(FORUM_CATEGORY_NAMES);
    const [selectedNavItem, setSelectedNavItem] = useState('Популярні');
    const [posts, setPosts] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [prevPosts, setPrevPosts] = useState([]);
    const postsRef = useRef(posts);

    const clearSearch = () => {
        setSearchQuery('');
    };
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleCategoryClick = (category) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(cat => cat !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const handleNavItemClick = (item) => {
        setSelectedNavItem(item);
    };

    useEffect(() => {
        let isCurrent = true;

        apiGet('/categories/forum', { skipAuth: true })
            .then((payload) => {
                if (!isCurrent) {
                    return;
                }

                const names = getForumCategoryNames(extractCollectionPayload(payload));
                if (names.length > 0) {
                    setCategoryFilters(names);
                    setSelectedCategories((currentCategories) => (
                        currentCategories.filter((category) => names.includes(category))
                    ));
                }
            })
            .catch((error) => {
                console.error("Failed to fetch forum categories:", error);
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    const fetchPosts = useCallback(async (page, reset = false) => {
        setLoading(true);
        setError(null);

        let url = '/posts';
        let queryParams = `?page=${page}&size=${POSTS_PER_PAGE}`;
        let applyClientSideCategoryFilter = false;

        let sortParamForCategoryEndpoint = '';
        if (selectedNavItem === 'Популярні') {
            sortParamForCategoryEndpoint = 'sort=likes,desc';
        } else if (selectedNavItem === 'Нові') {
            sortParamForCategoryEndpoint = 'sort=createdAt,desc';
        } else if (selectedNavItem === 'Старі') {
            sortParamForCategoryEndpoint = 'sort=createdAt,asc';
        }

        if (selectedCategories.length === 1) {
            url += `/by-category-name/${selectedCategories[0]}`;
            if (sortParamForCategoryEndpoint) {
                queryParams += `&${sortParamForCategoryEndpoint}`;
            }
        } else {
            if (selectedNavItem === 'Популярні') {
                url += '/by-popularity';
            } else if (selectedNavItem === 'Нові') {
                url += '/by-new';
            } else if (selectedNavItem === 'Старі') {
                url += '/by-old';
            }

            if (selectedCategories.length > 1) {
                applyClientSideCategoryFilter = true;
            }
        }

        try {
            const response = await apiFetch(url + queryParams);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            let fetchedPosts = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);

            if (applyClientSideCategoryFilter) {
                fetchedPosts = fetchedPosts.filter(post =>
                    post.categoryResponse && selectedCategories.includes(post.categoryResponse.name)
                );
            }

            setAllPosts(prevAll => (reset ? fetchedPosts : [...prevAll, ...fetchedPosts]));
            setPosts(prevPosts => (reset ? fetchedPosts : [...prevPosts, ...fetchedPosts]));
            setHasMore(fetchedPosts.length === POSTS_PER_PAGE);
            setPrevPosts([]);
        } catch (e) {
            console.error("Failed to fetch posts:", e);
            setError(e.message);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [selectedNavItem, selectedCategories]);

    useEffect(() => {
        postsRef.current = posts;
    }, [posts]);

    useEffect(() => {
        setPrevPosts(postsRef.current);
        setCurrentPage(0);
        setHasMore(true);
        fetchPosts(0, true);
    }, [fetchPosts]);

    useEffect(() => {
        if (currentPage === 0) {
            return;
        }

        if (searchQuery) return;
        fetchPosts(currentPage, false);
    }, [currentPage, fetchPosts, searchQuery]);


    useEffect(() => {
        if (!searchQuery) {
            setPosts(allPosts);
            setHasMore(allPosts.length >= POSTS_PER_PAGE);
            return;
        }

        try {
            const options = {
                keys: ['title', 'content', 'description', 'text', 'body'],
                threshold: 0.4,
                ignoreLocation: true,
                minMatchCharLength: 2,
            };

            const fuse = new Fuse(allPosts || [], options);
            const results = fuse.search(searchQuery);
            const items = results.map(r => r.item);
            setPosts(items);
            setHasMore(false);
        } catch (err) {
            console.error('Fuse search failed:', err);
            const filtered = allPosts.filter(post =>
                post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setPosts(filtered);
            setHasMore(false);
        }
    }, [searchQuery, allPosts]);

    const loadMorePosts = () => {
        if (!loading && hasMore) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const [lastComments, setLastComments] = useState({});

    useEffect(() => {
        apiFetch('/comments/last-comments')
            .then(res => res.json())
            .then(data => setLastComments(data))
            .catch((error) => {
                console.error("Failed to fetch last comments:", error);
                setLastComments({});
            });
    }, []);

    const mapCommentsByPostId = (comments) => {
        if (!comments) return {};

        const mapped = {};
        const list = Array.isArray(comments) ? comments : Object.values(comments);

        list.forEach(comment => {
            const postId = comment?.postResponse?.id;
            if (postId) {
                mapped[postId] = comment;
            }
        });

        return mapped;
    };

    const lastCommentsByPostId = mapCommentsByPostId(lastComments);
    const visiblePosts = loading && currentPage === 0 ? prevPosts : posts;

    const handlePostDeleted = useCallback((postId) => {
        setPosts((currentPosts) => removePostFromFeed(currentPosts, postId));
        setAllPosts((currentPosts) => removePostFromFeed(currentPosts, postId));
        setLastComments((currentComments) => {
            if (Array.isArray(currentComments)) {
                return currentComments.filter((comment) => comment?.postResponse?.id !== postId);
            }

            const nextComments = {};
            Object.entries(currentComments || {}).forEach(([key, comment]) => {
                if (String(key) !== String(postId) && comment?.postResponse?.id !== postId) {
                    nextComments[key] = comment;
                }
            });
            return nextComments;
        });
    }, []);

    const handlePostUpdated = useCallback((updatedPost) => {
        if (!updatedPost?.id) {
            return;
        }

        setPosts((currentPosts) => updatePostInFeed(currentPosts, updatedPost));
        setAllPosts((currentPosts) => updatePostInFeed(currentPosts, updatedPost));
    }, []);

    const showInitialSkeleton = loading && currentPage === 0 && visiblePosts.length === 0;
    const headingLabel = searchQuery
        ? `Результати пошуку «${searchQuery}»`
        : selectedCategories.length === 1
            ? selectedCategories[0]
            : selectedCategories.length > 1
                ? `Обрано категорій: ${selectedCategories.length}`
                : 'Усі обговорення';

    return (
        <div className="min-h-dvh bg-[linear-gradient(180deg,#fff_0%,#fbf1f3_280px,#f4f7fb_560px,var(--color-page)_100%)] text-text">
            <Header />
            <section className="relative overflow-hidden">
                <AmiContainer className="grid gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.52fr)] lg:items-end">
                    <div className="grid gap-5">
                        <div>
                            <h1 className="m-0 font-sans text-[clamp(2.35rem,5vw,4rem)]/[1.02] font-black text-ink">
                                Форум
                            </h1>
                            <p className="m-0 mt-4 max-w-2xl text-base/7 font-bold text-muted md:text-lg/8">
                                Пиши питання по парах, сесії, гуртожитку чи проєктах. Категорії допоможуть швидко знайти свою тему.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <AmiButton as={Link} to="/create-post" size="lg" className="no-underline max-sm:w-full">
                                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Створити пост
                            </AmiButton>
                            <AmiButton variant="secondary" size="lg" as="a" href="#feed" className="no-underline max-sm:w-full">
                                До обговорень
                            </AmiButton>
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-ami border border-white/80 bg-white/90 p-4 shadow-[var(--shadow-ami-md)] backdrop-blur">
                        {FORUM_GUIDE_ITEMS.map((item) => (
                            <div key={item.title} className="flex items-start gap-3 rounded-ami bg-soft px-4 py-3">
                                <span className="mt-1 size-2 rounded-full bg-accent" aria-hidden="true" />
                                <span className="grid min-w-0 gap-0.5">
                                    <strong className="font-sans text-sm/6 font-black text-ink">{item.title}</strong>
                                    <span className="text-sm/6 font-bold text-muted">{item.description}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </AmiContainer>
            </section>

            <AmiContainer id="feed" className="grid items-start gap-6 pb-10 pt-2 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8 lg:pb-14 lg:pt-4">
                <AmiPanel as="aside" className="self-start overflow-hidden bg-white/95 p-5 shadow-[var(--shadow-ami-sm)] backdrop-blur lg:sticky lg:top-20">
                    <div className="grid gap-5">
                        <div>
                            <label htmlFor="forum-search" className="mb-2 block font-sans text-sm/6 font-black uppercase tracking-wide text-muted">
                                Пошук
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="7" />
                                        <path d="m20 20-3.5-3.5" />
                                    </svg>
                                </span>
                                <input
                                    id="forum-search"
                                    type="text"
                                    placeholder="Шукати пост..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="h-12 w-full rounded-ami border border-border bg-surface pl-11 pr-10 text-sm/6 font-bold text-ink outline-hidden transition placeholder:text-muted focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/15"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        aria-label="Очистити пошук"
                                        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-ami border-0 bg-transparent p-0 text-muted transition hover:bg-accent-soft hover:text-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                                    >
                                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                                            <path d="M6 6l12 12M18 6 6 18" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <nav aria-label="Категорії форуму">
                            <h2 className="mb-3 font-sans text-sm/6 font-black uppercase tracking-wide text-muted">
                                Категорії
                            </h2>
                            <ul className="m-0 grid list-none gap-1.5 p-0">
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategories([])}
                                        className={cn(
                                            'group flex min-h-11 w-full items-center gap-3 rounded-ami border px-3.5 text-left text-sm/6 font-extrabold transition-[background-color,border-color,color,transform] duration-200 ease-out hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) motion-reduce:hover:translate-y-0',
                                            selectedCategories.length === 0
                                                ? 'border-accent bg-accent text-white shadow-[0_10px_24px_rgb(155_77_87/0.18)]'
                                                : 'border-transparent bg-transparent text-text hover:border-border hover:bg-soft hover:text-ink',
                                        )}
                                    >
                                        <span className="min-w-0 truncate">Усі обговорення</span>
                                    </button>
                                </li>
                                {categoryFilters.map((category) => {
                                    const isActive = selectedCategories.includes(category);
                                    return (
                                        <li key={category}>
                                            <button
                                                type="button"
                                                onClick={() => handleCategoryClick(category)}
                                                className={cn(
                                                    'group flex min-h-11 w-full items-center gap-3 rounded-ami border px-3.5 text-left text-sm/6 font-extrabold transition-[background-color,border-color,color,transform] duration-200 ease-out hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) motion-reduce:hover:translate-y-0',
                                                    isActive
                                                        ? 'border-accent bg-accent text-white shadow-[0_10px_24px_rgb(155_77_87/0.18)]'
                                                        : 'border-transparent bg-transparent text-text hover:border-border hover:bg-soft hover:text-ink',
                                                )}
                                                aria-pressed={isActive}
                                            >
                                                <span className="min-w-0 truncate">{category}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        <div className="rounded-ami border border-accent/15 bg-accent-soft/70 p-4">
                            <strong className="font-sans text-sm/6 font-black text-ink">Підказка</strong>
                            <p className="m-0 mt-2 text-sm/6 font-bold text-muted">
                                Не знайшов потрібного обговорення? Напиши свій пост або спробуй іншу категорію.
                            </p>
                        </div>
                    </div>
                </AmiPanel>

                <div className="grid gap-5">
                    <AmiPanel className="overflow-hidden bg-white/95 shadow-[var(--shadow-ami-sm)] backdrop-blur">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-linear-to-r from-white via-white to-accent-soft/35 px-5 py-4 sm:px-6 sm:py-5">
                            <div className="flex min-w-0 flex-col gap-1">
                                <h2 className="m-0 font-sans text-xl/7 font-black text-ink sm:text-2xl/8">{headingLabel}</h2>
                                <p className="m-0 text-sm/6 font-bold text-muted">
                                    {visiblePosts.length} {visiblePosts.length === 1 ? 'обговорення' : 'обговорень'}
                                    {selectedCategories.length > 0 && !searchQuery ? ` · ${selectedCategories.join(', ')}` : ''}
                                </p>
                            </div>
                            <div role="tablist" aria-label="Сортування" className="inline-flex shrink-0 rounded-ami border border-border bg-white p-1 shadow-[var(--shadow-ami-xs)]">
                                {SORT_FILTERS.map((item) => {
                                    const isActive = selectedNavItem === item;
                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            onClick={() => handleNavItemClick(item)}
                                            className={cn(
                                                'min-h-10 rounded-lg px-4 text-sm/6 font-extrabold transition-[background-color,color,box-shadow] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)',
                                                isActive
                                                    ? 'bg-white text-ink shadow-[0_1px_2px_rgb(15_23_42/0.08)]'
                                                    : 'bg-transparent text-muted hover:text-ink',
                                            )}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            {error && (
                                <div className="p-4 sm:p-5">
                                    <StatusMessage type="error" message={`Не вдалося завантажити пости: ${error}`} />
                                </div>
                            )}
                            {!error && showInitialSkeleton && (
                                <div className="flex flex-col">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-4 border-b border-border px-5 py-5 sm:px-6">
                                            <div className="ami-skeleton size-12 shrink-0 rounded-full" />
                                            <div className="flex-1 space-y-3">
                                                <div className="ami-skeleton h-5 w-3/4" />
                                                <div className="ami-skeleton h-4 w-1/2" />
                                                <div className="ami-skeleton h-4 w-1/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!error && !showInitialSkeleton && visiblePosts.length === 0 && (
                                <div className="flex flex-col items-center gap-4 px-5 py-14 text-center sm:px-6">
                                    <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                                        </svg>
                                    </span>
                                    <div className="grid gap-1.5">
                                        <h3 className="m-0 font-sans text-lg/7 font-black text-ink">{searchQuery ? 'Нічого не знайшли' : 'Поки що порожньо'}</h3>
                                        <p className="m-0 text-sm/6 font-bold text-muted">
                                            {searchQuery
                                                ? 'Спробуй інший запит або очисти фільтри.'
                                                : 'Стань першим — створи пост і запусти обговорення.'}
                                        </p>
                                    </div>
                                    {searchQuery ? (
                                        <AmiButton variant="secondary" onClick={clearSearch}>Очистити пошук</AmiButton>
                                    ) : (
                                        <AmiButton as={Link} to="/create-post" className="no-underline">Створити пост</AmiButton>
                                    )}
                                </div>
                            )}
                            {!error && !showInitialSkeleton && visiblePosts.map((post) => (
                                <Post
                                    key={post.id}
                                    {...post}
                                    lastComment={lastCommentsByPostId[post.id]}
                                    onDeleted={handlePostDeleted}
                                    onUpdated={handlePostUpdated}
                                />
                            ))}
                            {!loading && !error && hasMore && visiblePosts.length > 0 && (
                                <div className="flex justify-center px-5 py-6 sm:px-6">
                                    <AmiButton variant="secondary" size="lg" onClick={loadMorePosts} loading={loading} className="min-w-56">
                                        Завантажити ще
                                    </AmiButton>
                                </div>
                            )}
                            {loading && currentPage > 0 && (
                                <div className="flex items-center justify-center gap-2 px-5 py-6 text-sm/6 font-bold text-muted sm:px-6" aria-live="polite">
                                    <span className="ami-typing-dots" aria-hidden="true">
                                        <span /><span /><span />
                                    </span>
                                    Завантажуємо ще пости
                                </div>
                            )}
                        </div>
                    </AmiPanel>
                </div>
            </AmiContainer>
            <Footer />
        </div>
    );
}

export default Forum;
