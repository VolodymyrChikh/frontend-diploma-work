import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Fuse from "fuse.js/dist/fuse.esm.js";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import MediaCard from "../../components/MediaCard/MediaCard";
import StatusMessage from "../../components/StatusMessage/StatusMessage";
import { api, apiFetch } from "../../api/client";
import { AuthContext } from "../../context/auth-context.js";
import { canUseAuthenticatedAction, createSignInRedirect } from "../../auth/guards.js";
import {
  getProtectedActionErrorMessage,
  redirectToSignInOnAuthFailure,
} from "../../auth/protectedActions.js";
import { createStatus, getErrorMessage } from "../../utils/messages.js";
import { extractArray, extractPageContent } from "../../utils/apiPayload.js";
import { getMediaTypeLabel } from "../../utils/mediaResource.js";
import {
  MAX_FILES_PER_UPLOAD,
  createMediaResourcePayload,
  formatFileSize,
  getAcceptAttribute,
  getUploadMode,
  getUploadValidationMessage,
  validateSelectedFiles,
} from "../../utils/mediaUpload.js";
import { AmiButton, AmiContainer, AmiPanel } from "../../ui/ami.jsx";
import { cn } from "../../ui/cn.js";

const PAGE_SIZE = 12;

// RESOURCE_TYPE_OPTIONS are now dynamically generated from categories
const ORDER_OPTIONS = [
  { value: "newest", label: "Найновіші" },
  { value: "oldest", label: "Найстаріші" },
];

const INITIAL_UPLOAD_STATE = {
  title: "",
  description: "",
  type: "DOCUMENT", // Derived from category selection
  categoryId: "", 
  url: "",
};

function getResourceTypeForCategory(category) {
  if (!category || !category.name) return "DOCUMENT";
  const name = category.name.toLowerCase();
  if (name.includes("від")) return "VIDEO_LINK";
  if (name.includes("лінк") || name.includes("поклик")) return "EXTERNAL_LINK";
  if (name.includes("світлин") || name.includes("фото") || name.includes("зображ") || name.includes("ім")) return "IMAGE";
  return "DOCUMENT";
}

async function loadMediaCategories(apiClient) {
  const response = await apiClient.get("/api/file-categories");
  return extractArray(response.data);
}

const uploadFieldClass = "grid gap-2";
const uploadLabelClass = "text-sm/6 font-black text-ink";
const uploadInputClass = "min-h-12 w-full rounded-ami border border-border bg-surface px-4 text-base/7 font-extrabold text-ink outline-hidden transition duration-200 placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15";

const TYPE_ICONS = {
  all: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  DOCUMENT: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  ),
  VIDEO_LINK: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="14" height="14" rx="2" /><path d="m17 9 4-2v10l-4-2" />
    </svg>
  ),
  EXTERNAL_LINK: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  ),
  IMAGE: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" />
    </svg>
  ),
};

function MediaHub() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [activeOrder, setActiveOrder] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    totalPages: 0,
    last: true,
    loading: false,
  });
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchCacheRef = useRef({ query: "", items: [] });
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState(INITIAL_UPLOAD_STATE);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileName, setFileName] = useState("Жоден файл не вибраний");
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [pageStatus, setPageStatus] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const uploadMode = getUploadMode(uploadData.type);
  const isLinkUpload = uploadMode === "link";

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadStatus(null);
    
    const validation = validateSelectedFiles({
      type: uploadData.type,
      files,
    });

    if (files.length > 0 && !validation.valid) {
      setSelectedFiles([]);
      setFileName("Жоден файл не вибраний");
      setFileError(validation.message);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFiles(files);
    setFileError("");
    if (files.length === 1) {
      setFileName(files[0].name);
    } else if (files.length > 1) {
      setFileName(`${files.length} файлів вибрано`);
    } else {
      setFileName("Жоден файл не вибраний");
    }
  };

  const handleClearFile = () => {
    setSelectedFiles([]);
    setFileName("Жоден файл не вибраний");
    setFileError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseUploadModal = () => {
    setUploadData(INITIAL_UPLOAD_STATE);
    setUploadStatus(null);
    handleClearFile();
    setIsUploadModalOpen(false);
  };

  const redirectToSignInForUpload = () => {
    const redirect = createSignInRedirect(location, "Увійдіть, щоб додавати матеріали.");
    navigate(redirect.to, redirect.options);
  };

  const handleOpenUploadModal = () => {
    setPageStatus(null);
    if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
      redirectToSignInForUpload();
      return;
    }

    if (categories.length === 0) {
      loadMediaCategories(api)
        .then((loadedCategories) => {
          setCategories(loadedCategories);
          if (loadedCategories.length > 0) {
            setUploadData((prev) => ({
              ...prev,
              categoryId: String(loadedCategories[0].id),
              type: getResourceTypeForCategory(loadedCategories[0]),
            }));
          }
        })
        .catch((error) => {
          console.error("Error fetching media categories:", error);
          setPageStatus(createStatus("error", "Не вдалося завантажити категорії файлів"));
        });
    } else if (!uploadData.categoryId && categories.length > 0) {
      setUploadData((prev) => ({
        ...prev,
        categoryId: String(categories[0].id),
        type: getResourceTypeForCategory(categories[0]),
      }));
    }

    setIsUploadModalOpen(true);
  };

  const handleUploadInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData(prev => ({ ...prev, [name]: value }));
    setUploadStatus(null);
  };

  const handleUploadTypeChange = (categoryId) => {
    const category = categories.find((c) => String(c.id) === String(categoryId));
    const type = getResourceTypeForCategory(category);
    setUploadData((prev) => ({
      ...prev,
      type,
      url: type === "EXTERNAL_LINK" ? prev.url : "",
      categoryId: String(categoryId),
    }));
    setUploadStatus(null);
    handleClearFile();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!canUseAuthenticatedAction({ isAuthenticated, user })) {
      redirectToSignInForUpload();
      return;
    }

    const currentCategories = categories.length > 0 ? categories : await loadMediaCategories(api).catch(() => []);
    if (categories.length === 0 && currentCategories.length > 0) {
      setCategories(currentCategories);
    }

    const resolvedCategoryId = uploadData.categoryId || (currentCategories.length > 0 ? String(currentCategories[0].id) : "");
    const resolvedType = uploadData.categoryId ? uploadData.type : (currentCategories.length > 0 ? getResourceTypeForCategory(currentCategories[0]) : uploadData.type);
    
    const preparedUploadData = {
      ...uploadData,
      categoryId: resolvedCategoryId,
      type: resolvedType,
    };

    const validationMessage = getUploadValidationMessage({
      uploadData: preparedUploadData,
      selectedFiles,
    });

    if (validationMessage) {
      setUploadStatus(createStatus("error", validationMessage));
      return;
    }

    try {
      setIsUploading(true);

      if (isLinkUpload) {
        await api.post("/api/media", createMediaResourcePayload(preparedUploadData));
      } else {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });
        formData.append("title", uploadData.title.trim());
        if (uploadData.description?.trim()) formData.append("description", uploadData.description.trim());
        formData.append("type", uploadData.type);
        formData.append("categoryId", resolvedCategoryId);

        await api.post("/api/media/upload", formData, {
          timeout: 300000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
      }
      
      setUploadData(INITIAL_UPLOAD_STATE);
      handleClearFile();
      setIsUploadModalOpen(false);
      setUploadStatus(null);
      setPageStatus(createStatus("success", "Матеріал успішно завантажено."));
      fetchResources({ page: 0, append: false });
    } catch (error) {
      console.error("Помилка завантаження матеріалу:", error);
      
      let errorMessage = "Не вдалося завантажити. Спробуйте ще раз.";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Час очікування вичерпаний. Спробуйте завантажити менший файл.";
      } else if (error.message === "Network Error") {
        errorMessage = "Помилка мережі. Перевірте з'єднання та спробуйте ще раз.";
      } else if (error.response?.status === 413) {
        errorMessage = "Файл занадто великий. Використовуйте файл меншого розміру.";
      } else if (error.response?.status === 500) {
        errorMessage = "Помилка сервера. Спробуйте ще раз пізніше.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      const message = await getProtectedActionErrorMessage(error, errorMessage);
      if (redirectToSignInOnAuthFailure(error, {
        logout,
        navigate,
        location,
        message,
      })) {
        setIsUploadModalOpen(false);
        return;
      }

      setUploadStatus(createStatus("error", getErrorMessage(error, message)));
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    loadMediaCategories(api)
      .then(setCategories)
      .catch((error) => {
        console.error("Error fetching media categories:", error);
        setPageStatus(createStatus("error", "Не вдалося завантажити категорії файлів"));
      });
  }, []);

  useEffect(() => {
    if (!isUploadModalOpen || categories.length === 0) {
      return;
    }

    if (!uploadData.categoryId) {
      setUploadData((prev) => ({
        ...prev,
        categoryId: String(categories[0].id),
        type: getResourceTypeForCategory(categories[0]),
      }));
    }
  }, [categories, isUploadModalOpen, uploadData.categoryId]);

  const updatePageInfo = useCallback((pageData, isAppending) => {
    const content = extractPageContent(pageData);
    setResources((prev) => {
      const nextResources = isAppending ? [...prev, ...content] : content;
      const uniqueResources = [];
      const seenIds = new Set();

      nextResources.forEach((resource) => {
        const key = resource?.id || `${resource?.title || ""}-${resource?.createdAt || ""}`;
        if (seenIds.has(key)) {
          return;
        }

        seenIds.add(key);
        uniqueResources.push(resource);
      });

      return uniqueResources;
    });
    setPageInfo({
      page: Number.isInteger(pageData?.number) ? pageData.number : 0,
      totalPages: Number.isInteger(pageData?.totalPages) ? pageData.totalPages : 0,
      last: typeof pageData?.last === "boolean" ? pageData.last : true,
      loading: false,
    });
  }, []);

  const fetchResources = useCallback(async ({ page = 0, append = false } = {}) => {
    try {
      setPageInfo((prev) => ({ ...prev, loading: true }));
      const params = {
        page,
        size: PAGE_SIZE,
        sort: activeOrder === "oldest" || activeOrder === "longAgo" ? "createdAt,asc" : "createdAt,desc",
      };
      if (activeCategory !== "all") {
        params.categoryName = activeCategory;
      }
      if (activeType !== "all") {
        params.type = activeType;
      }

      const response = await api.get("/api/media", { params });
      updatePageInfo(response.data, append);
    } catch (error) {
      console.error("Error fetching media resources:", error);
      setPageStatus(createStatus("error", "Не вдалося завантажити матеріали медіатеки"));
      setPageInfo((prev) => ({ ...prev, loading: false }));
    }
  }, [activeCategory, activeOrder, activeType, updatePageInfo]);

  const fetchAllResourcesForSearch = useCallback(async () => {
    const size = 200;
    let page = 0;
    let last = false;
    const allResources = [];

    while (!last) {
      const params = {
        page,
        size,
        sort: activeOrder === "oldest" || activeOrder === "longAgo" ? "createdAt,asc" : "createdAt,desc",
      };

      if (activeCategory !== "all") {
        params.categoryName = activeCategory;
      }
      if (activeType !== "all") {
        params.type = activeType;
      }

      const response = await api.get("/api/media", { params });
      const pageData = response.data;
      allResources.push(...extractPageContent(pageData));

      last = typeof pageData?.last === "boolean" ? pageData.last : true;
      page += 1;
    }

    const uniqueResources = [];
    const seenIds = new Set();

    allResources.forEach((resource) => {
      const key = resource?.id || `${resource?.title || ""}-${resource?.createdAt || ""}`;
      if (seenIds.has(key)) {
        return;
      }
      seenIds.add(key);
      uniqueResources.push(resource);
    });

    return uniqueResources;
  }, [activeCategory, activeOrder, activeType]);

  const fetchSearchResults = useCallback(async ({ page = 0, append = false } = {}) => {
    const query = searchQuery.trim();
    if (!query) {
      return;
    }

    try {
      setPageInfo((prev) => ({ ...prev, loading: true }));
      let matchedItems = searchCacheRef.current.items;

      if (page === 0 || searchCacheRef.current.query !== query) {
        const searchableResources = await fetchAllResourcesForSearch();
        const options = {
          keys: ["title", "description"],
          threshold: 0.4,
          ignoreLocation: true,
          minMatchCharLength: 2,
        };

        const fuse = new Fuse(searchableResources || [], options);
        const results = fuse.search(query);
        matchedItems = results.map((result) => result.item);

        searchCacheRef.current = {
          query,
          items: matchedItems,
        };
      }

      const start = page * PAGE_SIZE;
      const nextChunk = matchedItems.slice(start, start + PAGE_SIZE);
      const totalPages = matchedItems.length > 0 ? Math.ceil(matchedItems.length / PAGE_SIZE) : 0;

      setResources((prev) => (append ? [...prev, ...nextChunk] : nextChunk));
      setPageInfo({
        page,
        totalPages,
        last: start + PAGE_SIZE >= matchedItems.length,
        loading: false,
      });
    } catch (error) {
      console.error("Error searching media resources:", error);
      setPageStatus(createStatus("error", "Не вдалося виконати пошук матеріалів"));
      setPageInfo((prev) => ({ ...prev, loading: false }));
    }
  }, [fetchAllResourcesForSearch, searchQuery]);

  useEffect(() => {
    if (searchActive) {
      return;
    }

    fetchResources({ page: 0, append: false });
  }, [fetchResources, searchActive]);

  useEffect(() => {
    if (searchQuery.trim() === "" && searchActive) {
      setSearchActive(false);
      fetchResources({ page: 0, append: false });
    }
  }, [fetchResources, searchQuery, searchActive]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchActive(false);
      fetchResources({ page: 0, append: false });
      return;
    }

    setSearchActive(true);
    fetchSearchResults({ page: 0, append: false });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchActive(false);
    searchCacheRef.current = { query: "", items: [] };
    fetchResources({ page: 0, append: false });
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const resetSearchState = () => {
    setSearchQuery("");
    setSearchActive(false);
    searchCacheRef.current = { query: "", items: [] };
  };

  const handleLoadMore = () => {
    if (pageInfo.loading || pageInfo.last) {
      return;
    }

    const nextPage = pageInfo.page + 1;
    if (searchActive) {
      fetchSearchResults({ page: nextPage, append: true });
    } else {
      fetchResources({ page: nextPage, append: true });
    }
  };

  const handleOpenResource = async (resource) => {
    const resourceUrl = resource?.url || resource?.fileUrls?.[0];
    if (!resource?.id || !resourceUrl) {
      return;
    }

    try {
      await apiFetch(`/api/media/${resource.id}/increment-views`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error incrementing views:", error);
    }

    window.open(resourceUrl, "_blank", "noopener,noreferrer");
  };

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
    resetSearchState();
  };

  const handleTypeToggle = (type) => {
    setActiveType((prev) => (prev === type ? "all" : type));
    resetSearchState();
  };

  const handleOrderSelect = (order) => {
    setActiveOrder(order);
    resetSearchState();
  };

  const handleResetFilters = () => {
    setActiveCategory("all");
    setActiveType("all");
    setActiveOrder("newest");
    resetSearchState();
  };

  const resourceTypeOptions = [
    { value: "all", label: "Усі" },
    ...categories.map(c => ({ value: getResourceTypeForCategory(c), label: c.name }))
  ];
  
  const uploadTypeOptions = categories.map(c => ({ value: String(c.id), label: c.name }));

  const showEmptyState = !pageInfo.loading && resources.length === 0;
  const isInitialLoading = pageInfo.loading && resources.length === 0;
  const hasActiveFilters = activeCategory !== "all" || activeType !== "all" || activeOrder !== "newest" || searchActive;
  const activeCategoryLabel = activeCategory === "all" ? "Усі категорії" : activeCategory;
  const activeTypeLabel = activeType === "all" ? "Усі типи" : getMediaTypeLabel(activeType);
  const activeOrderLabel = activeOrder === "oldest" ? "Найстаріші" : "Найновіші";
  const resultWord = resources.length === 1 ? "матеріал" : "матеріалів";
  const submitLabel = isLinkUpload ? "Додати лінк" : "Завантажити матеріал";

  return (
    <>
      <Header />
      <section className="min-h-dvh bg-page text-text">
        <div className="border-b border-border bg-linear-to-b from-accent-soft/60 to-transparent">
          <AmiContainer className="grid gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-4 min-w-0">
              <h1 className="m-0 font-sans text-[clamp(2rem,4.5vw,3.25rem)]/[1.05] font-black text-ink">
                Медіатека
              </h1>
              <p className="m-0 max-w-2xl text-base/7 font-bold text-muted md:text-lg/8">
                Конспекти, презентації, посилання й відео для навчання на ФПМІ.
              </p>
            </div>
            <div className="flex lg:justify-end">
              <AmiButton type="button" size="lg" onClick={handleOpenUploadModal} className="max-sm:w-full">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Завантажити
              </AmiButton>
            </div>
          </AmiContainer>
        </div>

        <AmiContainer className="py-8 lg:py-10">
          {pageStatus?.message && (
            <div className="mb-6">
              <StatusMessage
                type={pageStatus?.type}
                message={pageStatus?.message}
                onDismiss={() => setPageStatus(null)}
              />
            </div>
          )}

          <form onSubmit={handleSearchSubmit} className="flex gap-3 max-sm:flex-col">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Шукати у медіатеці..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-14 w-full rounded-ami border border-border bg-white pl-12 pr-12 text-base/7 font-bold text-ink outline-hidden transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Очистити пошук"
                  className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-ami border-0 bg-transparent p-0 text-muted transition hover:bg-accent-soft hover:text-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
            </div>
            <AmiButton type="submit" size="lg" className="max-sm:w-full">
              Знайти
            </AmiButton>
          </form>

          <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
            <AmiPanel as="aside" className="self-start p-5 lg:sticky lg:top-20">
              <div className="grid gap-5">
                <nav aria-label="Категорії медіатеки">
                  <h2 className="mb-3 font-sans text-sm/6 font-black uppercase tracking-wide text-muted">
                    Категорії
                  </h2>
                  <ul className="m-0 grid list-none gap-1.5 p-0">
                    <li>
                      <button
                        type="button"
                        onClick={() => handleCategoryClick("all")}
                        className={cn(
                          'group flex min-h-11 w-full items-center gap-3 rounded-ami border px-3.5 text-left text-sm/6 font-extrabold transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)',
                          activeCategory === "all"
                            ? 'border-accent/45 bg-accent-soft text-accent-strong shadow-[inset_3px_0_0_var(--color-accent)]'
                            : 'border-transparent bg-transparent text-text hover:border-border hover:bg-soft hover:text-ink',
                        )}
                      >
                        <span className={cn('grid size-8 shrink-0 place-items-center rounded-ami', activeCategory === "all" ? 'bg-white text-accent-strong' : 'bg-soft text-muted group-hover:bg-white group-hover:text-ink')}>
                          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
                          </svg>
                        </span>
                        <span className="min-w-0 truncate">Усі матеріали</span>
                      </button>
                    </li>
                    {categories.map((category) => {
                      const isActive = activeCategory === category.name;
                      return (
                        <li key={category.id}>
                          <button
                            type="button"
                            onClick={() => handleCategoryClick(category.name)}
                            aria-pressed={isActive}
                            className={cn(
                              'group flex min-h-11 w-full items-center gap-3 rounded-ami border px-3.5 text-left text-sm/6 font-extrabold transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)',
                              isActive
                                ? 'border-accent/45 bg-accent-soft text-accent-strong shadow-[inset_3px_0_0_var(--color-accent)]'
                                : 'border-transparent bg-transparent text-text hover:border-border hover:bg-soft hover:text-ink',
                            )}
                          >
                            <span className={cn('grid size-8 shrink-0 place-items-center rounded-ami font-sans text-sm/5 font-black', isActive ? 'bg-white text-accent-strong' : 'bg-soft text-muted group-hover:bg-white group-hover:text-ink')}>
                              {category.name?.charAt(0)?.toUpperCase() || "#"}
                            </span>
                            <span className="min-w-0 truncate">{category.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div>
                  <h3 className="mb-3 font-sans text-sm/6 font-black uppercase tracking-wide text-muted">
                    Сортування
                  </h3>
                  <div role="tablist" aria-label="Сортування" className="inline-flex w-full rounded-ami border border-border bg-soft p-1">
                    {ORDER_OPTIONS.map((option) => {
                      const isActive = activeOrder === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => handleOrderSelect(option.value)}
                          className={cn(
                            'flex-1 min-h-10 rounded-lg px-3 text-sm/6 font-extrabold transition-[background-color,color,box-shadow] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)',
                            isActive
                              ? 'bg-white text-ink shadow-[0_1px_2px_rgb(15_23_42/0.08)]'
                              : 'bg-transparent text-muted hover:text-ink',
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hasActiveFilters && (
                  <AmiButton type="button" variant="secondary" size="sm" onClick={handleResetFilters} className="w-full">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
                    </svg>
                    Скинути фільтри
                  </AmiButton>
                )}
              </div>
            </AmiPanel>

            <main className="min-w-0">
              <AmiPanel className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-strong px-5 py-4 sm:px-6 sm:py-5">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="m-0 font-sans text-xl/7 font-black text-ink sm:text-2xl/8">
                      {searchActive ? `Пошук: «${searchQuery.trim()}»` : activeCategoryLabel}
                    </h2>
                    <p className="m-0 text-sm/6 font-bold text-muted">
                      {resources.length} {resultWord}
                      {!searchActive && activeType !== 'all' ? ` · ${activeTypeLabel}` : ''}
                      {' · '}{activeOrderLabel}
                    </p>
                  </div>
                  <div role="tablist" aria-label="Тип матеріалу" className="inline-flex flex-wrap gap-1.5">
                    {resourceTypeOptions.map((option) => {
                      const isActive = activeType === option.value;
                      
                      return (
                        <button
                          key={option.label + option.value}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => handleTypeToggle(option.value)}
                          className={cn(
                            'inline-flex min-h-9 items-center gap-1.5 rounded-ami border px-3 text-xs/5 font-black transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)',
                            isActive
                              ? 'border-accent/45 bg-accent text-white'
                              : 'border-border bg-transparent text-text hover:border-accent/40 hover:bg-accent-soft hover:text-accent-strong',
                          )}
                        >
                          {TYPE_ICONS[option.value] || TYPE_ICONS["DOCUMENT"]}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {isInitialLoading && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-live="polite">
                      {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="grid gap-3 rounded-ami border border-border bg-surface-strong p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="ami-skeleton size-12" />
                            <div className="ami-skeleton h-6 w-20 rounded-ami" />
                          </div>
                          <div className="ami-skeleton h-15 w-full" />
                          <div className="ami-skeleton h-5 w-3/4" />
                          <div className="ami-skeleton h-4 w-full" />
                          <div className="ami-skeleton h-9 w-28" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!isInitialLoading && showEmptyState && (
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                      <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
                        </svg>
                      </span>
                      <div className="grid gap-1.5">
                        <h3 className="m-0 font-sans text-lg/7 font-black text-ink">
                          {searchActive ? 'Нічого не знайшли' : 'Поки що порожньо'}
                        </h3>
                        <p className="m-0 max-w-md text-sm/6 font-bold text-muted">
                          {searchActive
                            ? 'Спробуй інший запит або скинь фільтри.'
                            : 'Завантаж перший матеріал — і допоможи іншим студентам.'}
                        </p>
                      </div>
                      {searchActive ? (
                        <AmiButton variant="secondary" onClick={handleClearSearch}>Очистити пошук</AmiButton>
                      ) : (
                        <AmiButton onClick={handleOpenUploadModal}>Завантажити матеріал</AmiButton>
                      )}
                    </div>
                  )}

                  {!isInitialLoading && resources.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {resources.map((resource) => (
                        <MediaCard key={resource.id} resource={resource} onOpen={handleOpenResource} />
                      ))}
                    </div>
                  )}

                  {!showEmptyState && !pageInfo.last && resources.length > 0 && (
                    <div className="mt-6 flex justify-center">
                      <AmiButton
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={handleLoadMore}
                        loading={pageInfo.loading}
                        className="min-w-56"
                      >
                        Завантажити ще
                      </AmiButton>
                    </div>
                  )}

                  {pageInfo.loading && resources.length > 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm/6 font-bold text-muted" aria-live="polite">
                      <span className="ami-typing-dots" aria-hidden="true">
                        <span /><span /><span />
                      </span>
                      Завантажуємо ще
                    </div>
                  )}
                </div>
              </AmiPanel>
            </main>
          </div>
        </AmiContainer>
      </section>

      {isUploadModalOpen && (
        <div className="ami-fade-in fixed inset-0 z-1000 flex min-h-dvh items-center justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm" onClick={handleCloseUploadModal}>
          <div
            className="ami-elevated ami-overlay-motion w-full max-w-3xl overflow-hidden rounded-ami border border-border bg-surface-strong"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-upload-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="min-w-0">
                <h2 id="media-upload-title" className="m-0 font-sans text-2xl/8 font-black text-ink sm:text-3xl/10">Додати матеріал</h2>
                <p className="m-0 mt-1.5 text-sm/6 font-bold text-muted sm:text-base/7">Файл або корисне посилання для медіатеки.</p>
              </div>
              <button
                className="grid size-10 shrink-0 place-items-center rounded-ami border border-border bg-surface-strong text-ink transition duration-200 hover:border-accent hover:bg-accent hover:text-white active:bg-accent-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                onClick={handleCloseUploadModal}
                type="button"
                aria-label="Закрити"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="grid max-h-[calc(100dvh-9rem)] gap-5 overflow-y-auto p-6">
              {uploadStatus?.message && (
                <StatusMessage type={uploadStatus?.type} message={uploadStatus?.message} />
              )}
              <div>
                <span className="mb-2 block font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Тип матеріалу</span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Тип матеріалу">
                  {uploadTypeOptions.map((option) => {
                    const isActive = uploadData.categoryId === option.value;
                    const cat = categories.find(c => String(c.id) === option.value);
                    const iconType = getResourceTypeForCategory(cat);
                    
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        className={cn(
                          "inline-flex min-h-11 items-center gap-2 rounded-ami border px-4 text-sm/6 font-black transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
                          isActive
                            ? "border-accent bg-accent text-white"
                            : "border-border bg-transparent text-ink hover:border-accent/40 hover:bg-accent-soft hover:text-accent-strong",
                        )}
                        onClick={() => handleUploadTypeChange(option.value)}
                      >
                        {TYPE_ICONS[iconType]}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={uploadFieldClass}>
                <label className={uploadLabelClass}>Назва *</label>
                <input
                  type="text"
                  name="title"
                  value={uploadData.title}
                  onChange={handleUploadInputChange}
                  placeholder="Назва матеріалу"
                  className={uploadInputClass}
                  required
                />
              </div>

              <div className={uploadFieldClass}>
                <label className={uploadLabelClass}>Опис</label>
                <textarea
                  name="description"
                  value={uploadData.description}
                  onChange={handleUploadInputChange}
                  placeholder="Короткий опис"
                  rows="3"
                  className={cn(uploadInputClass, "min-h-24 resize-y py-2")}
                ></textarea>
              </div>
              {isLinkUpload ? (
                <div className={uploadFieldClass}>
                  <label htmlFor="upload-url" className={uploadLabelClass}>Посилання *</label>
                  <input
                    id="upload-url"
                    type="url"
                    name="url"
                    value={uploadData.url}
                    onChange={handleUploadInputChange}
                    placeholder="https://docs.google.com/..."
                    className={uploadInputClass}
                    required
                  />
                </div>
              ) : (
                <div className={uploadFieldClass}>
                  <span className={uploadLabelClass}>Файли *</span>
                  <p className="m-0 text-xs/5 font-bold text-muted">До {MAX_FILES_PER_UPLOAD} файлів, кожен до 50MB.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileChange}
                    required
                    accept={getAcceptAttribute(uploadData.type)}
                    className="sr-only"
                  />
                  <label
                    htmlFor="file-upload"
                    className="group flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-ami border-2 border-dashed border-border bg-soft px-5 py-4 text-center transition duration-200 hover:border-accent hover:bg-accent-soft focus-within:border-accent focus-within:bg-accent-soft"
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-white text-accent transition group-hover:bg-accent group-hover:text-white" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <path d="M17 8 12 3 7 8M12 3v12" />
                      </svg>
                    </span>
                    <span className="font-sans text-base/6 font-black text-ink">
                      {selectedFiles.length > 0 ? fileName : 'Перетягніть або клікніть, щоб обрати'}
                    </span>
                    <span className="text-xs/5 font-bold text-muted">{getMediaTypeLabel(uploadData.type)}</span>
                  </label>
                  {selectedFiles.length > 0 && (
                    <div className="grid gap-2 rounded-ami border border-border bg-soft p-3" aria-label="Вибрані файли">
                      {selectedFiles.map((file) => (
                        <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-ami bg-surface-strong px-3 py-2 text-sm/5 font-bold text-ink">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" />
                            </svg>
                            <span className="truncate">{file.name}</span>
                          </span>
                          <small className="shrink-0 text-xs/4 font-black text-muted">{formatFileSize(file.size)}</small>
                        </div>
                      ))}
                      <AmiButton type="button" variant="ghost" size="sm" onClick={handleClearFile} className="justify-self-start">
                        Очистити
                      </AmiButton>
                    </div>
                  )}
                  {fileError && (
                    <StatusMessage type="error" message={fileError} />
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
                <AmiButton type="button" variant="secondary" onClick={handleCloseUploadModal} disabled={isUploading} className="max-sm:w-full">
                  Скасувати
                </AmiButton>
                <AmiButton type="submit" size="lg" loading={isUploading} className="max-sm:w-full">
                  {submitLabel}
                </AmiButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default MediaHub;
