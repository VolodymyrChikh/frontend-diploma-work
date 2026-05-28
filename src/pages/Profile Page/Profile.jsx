import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StatusMessage from "../../components/StatusMessage/StatusMessage";
import anonymousAvatar from "../../assets/images/anonymous.jpg";
import { apiFetch } from "../../api/client";
import { AuthContext } from "../../context/auth-context.js";
import { canUseAuthenticatedAction, createSignInRedirect } from "../../auth/guards.js";
import { createStatus, getErrorMessage } from "../../utils/messages.js";
import {
  createProfileFormState,
  createProfileUpdatePayload,
  getProfileResponseErrorMessage,
  isAuthExpiredResponse,
  normalizeGithubUrl,
  normalizeProfileGroupName
} from "./profileForm.js";
import { AmiButton, AmiContainer, AmiPanel } from "../../ui/ami.jsx";
import { cn } from "../../ui/cn.js";
import ProfileSchedule from "./ProfileSchedule.jsx";

const TABS = [
  { id: "personal", label: "Особисті дані", available: true },
  { id: "schedule", label: "Розклад", available: true },
  // { id: "security", label: "Безпека", available: false },
  // { id: "notifications", label: "Сповіщення", available: false },
];

function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    specialtyId: "",
    groupId: "",
    bio: "",
    githubLink: ""
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isAvatarDeleting, setIsAvatarDeleting] = useState(false);
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();
  const {
    isAuthenticated,
    loading: authLoading,
    logout,
    updateCurrentUser,
    user: authenticatedUser,
  } = useContext(AuthContext);

  const fetchSpecialties = async () => {
    try {
      const response = await apiFetch("/specialties?size=100");
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data.content || data);
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
      setStatus(createStatus("error", "Не вдалося завантажити список спеціальностей"));
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await apiFetch("/api/academic-groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.content || data);
      }
    } catch (error) {
      console.error("Error fetching academic groups:", error);
      setStatus(createStatus("error", "Не вдалося завантажити список груп"));
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    if (specialties.length === 0) {
      fetchSpecialties();
    }
    if (groups.length === 0) {
      fetchGroups();
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (user) {
      setFormData(createProfileFormState(user));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const requestBody = createProfileUpdatePayload(user, formData);

      const response = await apiFetch(`/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        updateCurrentUser(updatedUser);
        setIsEditing(false);
        setStatus(createStatus("success", "Профіль успішно оновлено"));
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 2400);
      } else {
        const message = await getProfileResponseErrorMessage(response);
        setStatus(createStatus("error", message));

        if (isAuthExpiredResponse(response)) {
          logout();
          const redirect = createSignInRedirect(
            { pathname: '/profile' },
            message,
          );
          navigate(redirect.to, redirect.options);
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setStatus(createStatus("error", getErrorMessage(error, "Помилка з'єднання")));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAvatar = () => {
    if (!isEditing || isAvatarUploading) {
      return;
    }

    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const avatarFile = event.target.files?.[0];
    if (!avatarFile || !user?.id) {
      return;
    }

    if (!avatarFile.type?.startsWith("image/")) {
      setStatus(createStatus("error", "Можна завантажити тільки зображення."));
      event.target.value = "";
      return;
    }

    setIsAvatarUploading(true);
    setStatus(null);

    try {
      const payload = new FormData();
      payload.append("avatar", avatarFile);

      const response = await apiFetch(`/users/${user.id}/avatar`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const message = await getProfileResponseErrorMessage(response, "Не вдалося оновити аватарку.");
        setStatus(createStatus("error", message));

        if (isAuthExpiredResponse(response)) {
          logout();
          const redirect = createSignInRedirect(
            { pathname: '/profile' },
            message,
          );
          navigate(redirect.to, redirect.options);
        }
        return;
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      updateCurrentUser(updatedUser);
      setStatus(createStatus("success", "Аватарку успішно оновлено."));
    } catch (error) {
      setStatus(createStatus("error", getErrorMessage(error, "Не вдалося оновити аватарку.")));
    } finally {
      setIsAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    if (!user?.id || !user?.avatarLink) {
      return;
    }

    setIsAvatarDeleting(true);
    setStatus(null);

    try {
      const response = await apiFetch(`/users/${user.id}/avatar`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getProfileResponseErrorMessage(response, "Не вдалося видалити аватарку.");
        setStatus(createStatus("error", message));

        // Avoid auto-logging-out the user when delete fails (e.g. transient server error).
        // Keep existing behavior elsewhere that handles auth expiry explicitly.
        return;
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      updateCurrentUser(updatedUser);
      setStatus(createStatus("success", "Аватарку видалено."));
    } catch (error) {
      setStatus(createStatus("error", getErrorMessage(error, "Не вдалося видалити аватарку.")));
    } finally {
      setIsAvatarDeleting(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!canUseAuthenticatedAction({ isAuthenticated, user: authenticatedUser })) {
      const redirect = createSignInRedirect(
        { pathname: '/profile' },
        'Будь ласка, увійдіть для перегляду профілю.',
      );
      navigate(redirect.to, redirect.options);
      return;
    }

    setUser(authenticatedUser);
    setFormData(createProfileFormState(authenticatedUser));

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [authLoading, authenticatedUser, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/main", { replace: true });
  };

  const fieldClassName =
    "h-12 w-full rounded-ami border border-border bg-white px-4 text-sm/6 font-bold text-ink outline-hidden transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15";
  const valueClassName =
    "flex min-h-12 w-full items-center rounded-ami border border-border bg-soft px-4 py-2 text-sm/6 font-bold text-ink";
  const emptyValueClassName =
    "flex min-h-12 w-full items-center rounded-ami border border-dashed border-border bg-soft px-4 py-2 text-sm/6 font-bold text-muted italic";
  const labelClassName =
    "mb-2 block font-sans text-xs/5 font-black uppercase tracking-wide text-muted";

  const role = user?.specialtyResponse?.name === "Абітурієнт" ? "Абітурієнт" : "Студент";
  const profileSummaryItems = [
    { key: "role", label: "Статус", value: role },
    { key: "specialty", label: "Спеціальність", value: user?.specialtyResponse?.name || "Не вказано" },
    { key: "group", label: "Група", value: user?.groupResponse?.name || normalizeProfileGroupName(user?.groupName) || "Не вказано" },
    { key: "github", label: "GitHub", value: user?.githubLink ? "Додано" : "Не вказано" },
  ];

  return (
    <>
      <Header />
      <div className="min-h-dvh bg-page text-text">
        {showSuccessPopup && (
          <div
            role="status"
            aria-live="polite"
            className="ami-elevated ami-overlay-motion fixed right-5 top-20 z-50 inline-flex items-center gap-2 rounded-ami border border-green-200 bg-green-50 px-4 py-3 text-sm/6 font-extrabold text-green-700"
          >
            <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="m8 12.5 2.7 2.7L16 9.8" />
            </svg>
            Профіль успішно оновлено
          </div>
        )}

        {isLoading ? (
          <AmiContainer className="py-10">
            <AmiPanel className="grid gap-8 p-8 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="flex flex-col items-center gap-4">
                <div className="ami-skeleton size-28 rounded-full" />
                <div className="ami-skeleton h-5 w-32" />
                <div className="ami-skeleton h-4 w-20" />
                <div className="grid w-full gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="ami-skeleton h-10 w-full" />
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="ami-skeleton h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="grid gap-2">
                      <div className="ami-skeleton h-3 w-24" />
                      <div className="ami-skeleton h-12 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </AmiPanel>
          </AmiContainer>
        ) : user && (
          <>
            <section className="border-b border-border bg-linear-to-b from-accent-soft/60 to-transparent">
              <AmiContainer className="grid items-end gap-6 py-10 md:py-14 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <img
                      src={user.avatarLink || anonymousAvatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="size-24 shrink-0 rounded-full border-4 border-white object-cover shadow-[0_8px_28px_rgb(15_23_42/0.12)] sm:size-28"
                    />
                    <span className="absolute bottom-1 right-1 grid size-6 place-items-center rounded-full border-2 border-white bg-green-500" aria-label="Онлайн">
                      <span className="sr-only">Онлайн</span>
                    </span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleSelectAvatar}
                        disabled={isAvatarUploading}
                        className="absolute -right-1.5 -top-1.5 inline-grid size-9 place-items-center rounded-full border border-white bg-accent text-white shadow-[0_8px_20px_rgb(155_77_87/0.35)] transition hover:bg-accent-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Змінити аватар"
                      >
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="m-0 font-sans text-[clamp(1.75rem,3.5vw,2.5rem)]/[1.1] font-black text-ink">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="m-0 mt-1 text-sm/6 font-bold text-muted">
                      {role}
                      {user.specialtyResponse?.name ? ` · ${user.specialtyResponse.name}` : ""}
                      {user.groupName ? ` · ${user.groupName}` : ""}
                    </p>
                    {isEditing && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <AmiButton
                          type="button"
                          variant="soft"
                          size="sm"
                          onClick={handleSelectAvatar}
                          loading={isAvatarUploading}
                          disabled={isAvatarDeleting}
                        >
                          {user.avatarLink ? "Змінити фото" : "Додати фото"}
                        </AmiButton>
                        <AmiButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleAvatarDelete}
                          loading={isAvatarDeleting}
                          disabled={!user.avatarLink || isAvatarUploading}
                        >
                          Видалити фото
                        </AmiButton>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden lg:block" />

                <div className="flex flex-wrap gap-3 lg:justify-end">
                  {!isEditing && (
                    <>
                      <AmiButton type="button" variant="secondary" size="lg" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <path d="m16 17 5-5-5-5M21 12H9" />
                        </svg>
                        Вийти
                      </AmiButton>
                      <AmiButton type="button" size="lg" onClick={startEditing}>
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                        </svg>
                        Редагувати
                      </AmiButton>
                    </>
                  )}
                </div>
              </AmiContainer>
            </section>

            <AmiContainer className="grid items-start gap-6 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-10">
              <AmiPanel as="aside" className="self-start p-5 lg:sticky lg:top-20">
                <h2 className="m-0 mb-4 font-sans text-sm/6 font-black uppercase tracking-wide text-muted">
                  Профіль
                </h2>
                <ul className="m-0 grid list-none gap-2 p-0">
                  {profileSummaryItems.map((item) => (
                    <li key={item.key} className="grid gap-1 rounded-ami border border-border bg-soft px-3 py-2.5">
                      <span className="text-xs/5 font-black uppercase tracking-wide text-muted">{item.label}</span>
                      <strong className="min-w-0 truncate font-sans text-sm/6 font-black text-ink">{item.value}</strong>
                    </li>
                  ))}
                </ul>

              </AmiPanel>

              <div className="min-w-0">
                {status?.message && (
                  <div className="mb-5">
                    <StatusMessage type={status?.type} message={status?.message} onDismiss={() => setStatus(null)} />
                  </div>
                )}

                <AmiPanel className="overflow-hidden">
                  <div role="tablist" aria-label="Налаштування профілю" className="flex gap-1 overflow-visible border-b border-border bg-surface-strong px-3 pt-3 sm:px-5 sm:pt-4">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          disabled={!tab.available}
                          onClick={() => tab.available && setActiveTab(tab.id)}
                          className={cn(
                            "relative inline-flex min-h-11 items-center gap-2 border-0 bg-transparent px-4 text-sm/6 font-extrabold transition-[color] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
                            isActive ? "text-accent-strong" : "text-muted hover:text-ink",
                            !tab.available && "cursor-not-allowed opacity-60",
                          )}
                        >
                          {tab.label}
                          {!tab.available && (
                            <span className="rounded-ami border border-border bg-soft px-2 py-0.5 text-[10px]/4 font-black text-muted">скоро</span>
                          )}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute -bottom-px left-2 right-2 h-0.5 rounded-full transition-[background-color] duration-200",
                              isActive ? "bg-accent" : "bg-transparent",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {activeTab === 'personal' ? (
                    <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="profile-specialty" className={labelClassName}>Моя спеціальність</label>
                        {isEditing ? (
                          <div className="relative">
                            <select
                              id="profile-specialty"
                              name="specialtyId"
                              value={formData.specialtyId}
                              onChange={handleInputChange}
                              className={cn(fieldClassName, "appearance-none pr-11")}
                            >
                              <option value="">Оберіть спеціальність</option>
                              {specialties.map((spec) => (
                                <option key={spec.id} value={spec.id}>
                                  {spec.name}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </span>
                          </div>
                        ) : (
                          <span className={user.specialtyResponse?.name ? valueClassName : emptyValueClassName}>
                            {user.specialtyResponse?.name || "Не вказано"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className={labelClassName}>Email</label>
                        <span className={cn(valueClassName, "gap-2")}>
                          <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="m3 7 9 6 9-6" />
                          </svg>
                          <span className="min-w-0 truncate">{user.email}</span>
                        </span>
                      </div>

                      <div>
                        <label htmlFor="profile-group" className={labelClassName}>Група</label>
                        {isEditing ? (
                          <div className="relative">
                            <select
                              id="profile-group"
                              name="groupId"
                              value={formData.groupId}
                              onChange={handleInputChange}
                              className={cn(fieldClassName, "appearance-none pr-11")}
                            >
                              <option value="">Оберіть групу</option>
                              {groups.map((group) => (
                                <option key={group.id ?? group.name} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </span>
                          </div>
                        ) : (
                          <span className={(user.groupResponse?.name || user.groupName) ? valueClassName : emptyValueClassName}>
                            {user.groupResponse?.name || normalizeProfileGroupName(user.groupName) || "Не вказано"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label htmlFor="profile-github" className={labelClassName}>GitHub</label>
                        {isEditing ? (
                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.52-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.37-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
                              </svg>
                            </span>
                            <input
                              id="profile-github"
                              type="text"
                              name="githubLink"
                              value={formData.githubLink}
                              onChange={handleInputChange}
                              className={cn(fieldClassName, "pl-11")}
                              placeholder="https://github.com/username"
                            />
                          </div>
                        ) : (
                          user.githubLink ? (
                            <a
                              href={normalizeGithubUrl(user.githubLink)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-12 w-full items-center gap-2 rounded-ami border border-border bg-soft px-4 py-2 text-sm/6 font-bold text-accent-strong no-underline transition hover:border-accent/40 hover:bg-accent-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                            >
                              <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true">
                                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.52-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.37-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
                            </svg>
                              <span className="min-w-0 truncate">{user.githubLink}</span>
                              <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M7 17 17 7M9 7h8v8" />
                              </svg>
                            </a>
                          ) : (
                            <span className={emptyValueClassName}>Не вказано</span>
                          )
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="profile-bio" className={labelClassName}>Про себе</label>
                        {isEditing ? (
                          <textarea
                            id="profile-bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            className={cn(fieldClassName, "min-h-32 py-3 resize-y")}
                            placeholder="Розкажіть трохи про себе..."
                            maxLength={500}
                          />
                        ) : (
                          <span className={cn(user.bio ? valueClassName : emptyValueClassName, "min-h-24 items-start whitespace-pre-wrap py-3")}>
                            {user.bio || "Не вказано"}
                          </span>
                        )}
                        {isEditing && (
                          <p className="m-0 mt-1.5 text-right text-xs/5 font-bold text-muted">
                            {formData.bio.length}/500
                          </p>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-surface px-5 py-4 sm:px-6">
                          <AmiButton type="button" variant="secondary" onClick={cancelEditing} disabled={isSaving} size="lg">
                            Скасувати
                          </AmiButton>
                          <AmiButton type="button" onClick={handleSave} loading={isSaving} size="lg">
                            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                              <path d="M17 21v-8H7v8M7 3v5h8" />
                            </svg>
                            Зберегти
                          </AmiButton>
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'schedule' ? (
                    <div className="p-5 sm:p-6 md:col-span-2">
                      <ProfileSchedule user={user} />
                    </div>
                  ) : null}
                </AmiPanel>
              </div>
            </AmiContainer>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Profile;
