import { useEffect, useMemo, useState, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { apiFetch } from '../../api/client';
import { extractCollectionPayload, readJsonPayload } from '../../utils/apiPayload.js';
import { formatCreditCount, formatSubjectCount, getTotalCredits } from '../../utils/courseMap.js';
import { AmiButton, AmiContainer, AmiPanel } from '../../ui/ami.jsx';
import { cn } from '../../ui/cn.js';
import { AuthContext } from '../../context/auth-context.js';
import { SubjectModal, SelectiveGroupModal } from './CourseMapAdminModals.jsx';

const BLOCK_TYPE_LABELS = {
    HUMANITARIAN: 'Гуманітарний блок',
    SCIENTIFIC: 'Природничо-науковий блок',
    PROFESSIONAL: 'Фаховий блок',
    PDFC: 'Фахова дисципліна вільного вибору'
};

const BLOCK_TYPE_SHORT = {
    HUMANITARIAN: 'Гуманітарний',
    SCIENTIFIC: 'Природничо-науковий',
    PROFESSIONAL: 'Фаховий',
    PDFC: 'Вільний вибір',
};

const EXAM_TYPE_LABELS = {
    EXAM: 'Іспит',
    CREDIT: 'Залік',
    COURSEWORK: 'Курсова робота',
    DIPLOMA: 'Дипломна робота',
    MAGISTER: 'Магістерська робота',
    DIFFERENTIATED_CREDIT: 'Диф. залік',
    OTHER: 'Немає'
};

const BLOCK_TYPE_STYLES = {
    HUMANITARIAN: 'border-amber-200 bg-amber-50 text-amber-800',
    SCIENTIFIC: 'border-purple-200 bg-purple-50 text-purple-800',
    PROFESSIONAL: 'border-blue-200 bg-blue-50 text-blue-800',
    PDFC: 'border-green-200 bg-green-50 text-green-800',
};

const BLOCK_TYPE_DOT = {
    HUMANITARIAN: 'bg-amber-400',
    SCIENTIFIC: 'bg-purple-500',
    PROFESSIONAL: 'bg-blue-400',
    PDFC: 'bg-green-400',
};

// Prefer the real backend route first. The legacy route can be served by the frontend (HTML)
// and would otherwise break JSON parsing.
const SELECTIVE_GROUP_ENDPOINTS = ['/api/v1/selective-groups', '/selective-groups'];

async function fetchSelectiveGroups(pathSuffix = '', options = {}) {
    let lastResponse = null;

    const method = String(options?.method || 'GET').toUpperCase();

    for (const basePath of SELECTIVE_GROUP_ENDPOINTS) {
        const response = await apiFetch(`${basePath}${pathSuffix}`, options);
        lastResponse = response;

        if (response.status === 404) {
            continue;
        }

        // For GET requests, ensure we actually got JSON back (dev servers may return HTML).
        if (method === 'GET') {
            const contentType = response.headers?.get?.('content-type') || '';
            if (contentType && !contentType.toLowerCase().includes('json')) {
                continue;
            }
        }

        return response;
    }

    return lastResponse;
}

function CourseMapPage() {
    const [searchParams] = useSearchParams();
    const levelFromUrl = searchParams.get('level');
    const specialtyFromUrl = searchParams.get('specialty');

    const [degreeLevel, setDegreeLevel] = useState(levelFromUrl === 'master' ? 'master' : 'bachelor');
    const [specialties, setSpecialties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(null);
    const [selectiveGroups, setSelectiveGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { user } = useContext(AuthContext);
    // Backend stores roles like "ROLE_ADMIN" or "ROLE_USER"; check for "ADMIN" substring
    const isAdmin = Boolean(user?.role && user.role.includes('ADMIN'));
    const [subjectModalConfig, setSubjectModalConfig] = useState({ isOpen: false, item: null, semester: 1 });
    const [groupModalConfig, setGroupModalConfig] = useState({ isOpen: false, item: null, semester: 1 });

    const handleDeleteSubject = async (id) => {
        if (!window.confirm("Дійсно видалити предмет?")) return;
        try {
            await apiFetch(`/subjects/${id}`, { method: 'DELETE' });
            setSubjects(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error(error);
            alert("Помилка видалення");
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm("Дійсно видалити групу? Усі предмети групи потрібно видалити спочатку.")) return;
        try {
            await fetchSelectiveGroups(`/${id}`, { method: 'DELETE' });
            setSelectiveGroups(prev => prev.filter(sg => sg.id !== id));
        } catch (error) {
            console.error(error);
            alert("Помилка видалення");
        }
    };

    const visibleSpecialties = useMemo(
        () => specialties.filter((specialty) => specialty.id !== 12),
        [specialties]
    );

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            setLoading(true);
            setError('');

            try {
                const [specialtiesRes, subjectsRes, selectiveGroupsRes] = await Promise.all([
                    apiFetch('/specialties?size=200'),
                    apiFetch('/subjects?size=2000&sort=semester,asc'),
                    fetchSelectiveGroups()
                ]);

                if (!specialtiesRes.ok) {
                    throw new Error('Не вдалося завантажити спеціальності.');
                }

                if (!subjectsRes.ok) {
                    throw new Error('Не вдалося завантажити предмети.');
                }
                
                if (!selectiveGroupsRes.ok) {
                     console.warn('Не вдалося завантажити вибіркові групи. Вони можуть бути недоступні.');
                }

                const specialtiesPayload = await readJsonPayload(specialtiesRes);
                const subjectsPayload = await readJsonPayload(subjectsRes);
                const selectiveGroupsPayload = selectiveGroupsRes.ok ? await readJsonPayload(selectiveGroupsRes) : [];

                if (!isMounted) {
                    return;
                }

                if (!specialtiesPayload || !subjectsPayload) {
                    throw new Error('Не вдалося прочитати дані карти курсів. Перевір, чи працює сервер.');
                }

                const loadedSpecialties = extractCollectionPayload(specialtiesPayload);
                const loadedSubjects = extractCollectionPayload(subjectsPayload);
                const loadedSelectiveGroups = Array.isArray(selectiveGroupsPayload) ? selectiveGroupsPayload : extractCollectionPayload(selectiveGroupsPayload);
                const loadedVisibleSpecialties = loadedSpecialties.filter((specialty) => specialty.id !== 12);

                setSpecialties(loadedSpecialties);
                setSubjects(loadedSubjects);
                setSelectiveGroups(loadedSelectiveGroups || []);

                if (loadedVisibleSpecialties.length > 0) {
                    const matchedByQuery = loadedVisibleSpecialties.find((specialty) => {
                        const number = String(specialty?.number || '').toLowerCase();
                        const id = String(specialty?.id || '');
                        const name = String(specialty?.name || '').toLowerCase();
                        const searched = String(specialtyFromUrl || '').toLowerCase();

                        return number === searched || id === searched || name === searched;
                    });

                    const firstVisible = loadedVisibleSpecialties[0];

                    if (matchedByQuery) {
                        setSelectedSpecialtyId(matchedByQuery.id);
                    } else {
                        setSelectedSpecialtyId(firstVisible.id);
                    }
                }
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError.message || 'Не вдалося завантажити карту курсів. Перевір, чи працює сервер.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, [specialtyFromUrl]);

    const selectedSpecialty = useMemo(
        () => specialties.find((specialty) => specialty.id === selectedSpecialtyId) || null,
        [specialties, selectedSpecialtyId]
    );

    const filteredSubjects = useMemo(() => {
        return subjects
            .filter((subject) => subject.specialtyId === selectedSpecialtyId)
            .filter((subject) => {
                if (degreeLevel === 'master') {
                    return subject.degreeLevel === 'MASTER';
                }

                return subject.degreeLevel !== 'MASTER';
            })
            .sort((a, b) => {
                if ((a.semester || 0) !== (b.semester || 0)) {
                    return (a.semester || 0) - (b.semester || 0);
                }

                return (a.name || '').localeCompare(b.name || '');
            });
    }, [subjects, selectedSpecialtyId, degreeLevel]);

    const subjectsBySemester = useMemo(() => {
        return filteredSubjects.reduce((acc, subject) => {
            const semester = subject.semester || 0;
            if (!acc[semester]) {
                acc[semester] = [];
            }
            acc[semester].push(subject);
            return acc;
        }, {});
    }, [filteredSubjects]);

    const selectiveGroupsMap = useMemo(() => {
        const map = {};
        (selectiveGroups || []).forEach((g) => {
            map[g.id] = g;
        });
        return map;
    }, [selectiveGroups]);

    // Merge subjects that belong to the same selective group into a single display item
    const displayFilteredSubjects = useMemo(() => {
        const grouped = {};
        const others = [];

        filteredSubjects.forEach((subject) => {
            if (subject.selectiveGroupId) {
                const sg = subject.selectiveGroupId;
                if (!grouped[sg]) {
                    grouped[sg] = { options: [], semester: subject.semester };
                }
                grouped[sg].options.push(subject);
            } else {
                others.push(subject);
            }
        });

        const merged = [...others];
        Object.keys(grouped).forEach((sgId) => {
            merged.push({
                id: `sg-${sgId}`,
                isSelectiveGroup: true,
                selectiveGroupId: Number(sgId),
                name: selectiveGroupsMap[sgId]?.name || 'Вибіркова група',
                options: grouped[sgId].options,
                semester: grouped[sgId].semester
            });
        });

        return merged.sort((a, b) => {
            if ((a.semester || 0) !== (b.semester || 0)) {
                return (a.semester || 0) - (b.semester || 0);
            }

            const aName = a.isSelectiveGroup ? (a.name || '') : (a.name || '');
            const bName = b.isSelectiveGroup ? (b.name || '') : (b.name || '');
            return aName.localeCompare(bName, 'uk');
        });
    }, [filteredSubjects, selectiveGroupsMap]);

    const displaySubjectsBySemester = useMemo(() => {
        return displayFilteredSubjects.reduce((acc, item) => {
            const semester = item.semester || 0;
            if (!acc[semester]) acc[semester] = [];
            acc[semester].push(item);
            return acc;
        }, {});
    }, [displayFilteredSubjects]);

    const displayTotalCredits = useMemo(() => {
        return displayFilteredSubjects.reduce((total, item) => {
            if (item.isSelectiveGroup) {
                const credits = Number(item.options?.[0]?.credits);
                return Number.isFinite(credits) ? total + credits : total;
            }
            const credits = Number(item?.credits);
            return Number.isFinite(credits) ? total + credits : total;
        }, 0);
    }, [displayFilteredSubjects]);

    const displaySubjectsCount = displayFilteredSubjects.length;

    const displayBlockBreakdown = useMemo(() => {
        const counts = { HUMANITARIAN: 0, SCIENTIFIC: 0, PROFESSIONAL: 0, PDFC: 0, OTHER: 0 };
        displayFilteredSubjects.forEach((item) => {
            let key = 'OTHER';
            if (item.isSelectiveGroup) {
                const bt = item.options?.[0]?.blockType;
                key = bt in counts ? bt : 'OTHER';
            } else {
                key = item.blockType in counts ? item.blockType : 'OTHER';
            }
            counts[key] += 1;
        });
        return counts;
    }, [displayFilteredSubjects]);
    
    const semesters = degreeLevel === 'bachelor'
        ? [1, 2, 3, 4, 5, 6, 7, 8]
        : [1, 2, 3, 4];
    const totalCredits = displayTotalCredits; 
    const selectedDegreeLabel = degreeLevel === 'bachelor' ? 'Бакалавр' : 'Магістр';

    

    return (
        <div className="min-h-dvh bg-page text-ink">
            <Header />

            <section className="border-b border-border bg-linear-to-b from-accent-soft/60 to-transparent">
                <AmiContainer className="grid gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="grid min-w-0 gap-4">
                        <h1 className="m-0 font-sans text-[clamp(2rem,4.5vw,3.25rem)]/[1.05] font-black text-ink">
                            Карта курсів
                        </h1>
                        <p className="m-0 max-w-2xl text-base/7 font-bold text-muted md:text-lg/8">
                            Обирай рівень навчання та спеціальність — і дивись, які предмети чекають у кожному семестрі, з типом блоку і формою контролю.
                        </p>
                    </div>
                </AmiContainer>
            </section>

            <AmiContainer className="grid gap-6 py-8 lg:gap-8 lg:py-10">
                <AmiPanel className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end">
                    <div className="grid gap-2">
                        <span className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Освітній рівень</span>
                        <div role="tablist" aria-label="Освітній рівень" className="inline-flex w-full rounded-ami border border-border bg-soft p-1 lg:w-auto">
                            {[
                                { value: 'bachelor', label: 'Бакалавр' },
                                { value: 'master', label: 'Магістр' },
                            ].map((option) => {
                                const isActive = degreeLevel === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setDegreeLevel(option.value)}
                                        className={cn(
                                            'min-h-11 flex-1 rounded-lg px-6 text-sm/6 font-extrabold transition-[background-color,color,box-shadow] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) lg:min-w-32',
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

                    <div className="grid gap-2">
                        <label htmlFor="specialtySelect" className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Спеціальність</label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 9h20M5 4h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
                                </svg>
                            </span>
                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </span>
                            <select
                                id="specialtySelect"
                                disabled={loading || visibleSpecialties.length === 0}
                                className="h-12 w-full appearance-none rounded-ami border border-border bg-white pl-12 pr-10 text-base/7 font-extrabold text-ink outline-hidden transition duration-200 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                                value={selectedSpecialtyId || ''}
                                onChange={(event) => setSelectedSpecialtyId(Number(event.target.value))}
                            >
                                {visibleSpecialties.length === 0 && (
                                    <option value="" disabled>Немає доступних спеціальностей</option>
                                )}
                                {[...visibleSpecialties]
                                    .sort((a, b) => a.number.localeCompare(b.number, 'uk'))
                                    .map((specialty) => (
                                        <option key={specialty.id} value={specialty.id}>
                                            {specialty.number} — {specialty.name}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                </AmiPanel>

                {!loading && !error && selectedSpecialty && (
                    <AmiPanel className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" aria-label="Підсумок карти курсів">
                        <div className="grid gap-2">
                            <span className="font-sans text-xs/5 font-black uppercase tracking-wide text-accent">Обрана програма</span>
                            <h2 className="m-0 font-sans text-2xl/9 font-black text-ink">
                                <span className="mr-2 inline-flex items-center rounded-md border border-accent/30 bg-accent-soft px-2 py-0.5 text-base/7 font-black text-accent-strong">{selectedSpecialty.number}</span>
                                {selectedSpecialty.name}
                            </h2>
                        </div>
                        <dl className="grid grid-cols-3 gap-3 lg:gap-4">
                            <div className="rounded-ami border border-border bg-soft px-4 py-3 text-center">
                                <dt className="text-xs/5 font-black uppercase tracking-wide text-muted">Рівень</dt>
                                <dd className="m-0 mt-1 font-sans text-base/6 font-black text-ink">{selectedDegreeLabel}</dd>
                            </div>
                            <div className="rounded-ami border border-border bg-soft px-4 py-3 text-center">
                                    <dt className="text-xs/5 font-black uppercase tracking-wide text-muted">Предметів</dt>
                                    <dd className="m-0 mt-1 font-sans text-base/6 font-black text-ink">{displaySubjectsCount}</dd>
                                </div>
                            <div className="rounded-ami border border-border bg-soft px-4 py-3 text-center">
                                <dt className="text-xs/5 font-black uppercase tracking-wide text-muted">Кредитів</dt>
                                <dd className="m-0 mt-1 font-sans text-base/6 font-black text-ink">{totalCredits}</dd>
                            </div>
                        </dl>
                    </AmiPanel>
                )}

                <AmiPanel className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="m-0 font-sans text-lg/7 font-black text-ink">Легенда блоків</h2>
                        <span className="text-xs/5 font-bold text-muted">{displaySubjectsCount} предметів у поточному виборі</span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { key: 'HUMANITARIAN', label: 'Гуманітарний' },
                            { key: 'SCIENTIFIC', label: 'Природничо-науковий' },
                            { key: 'PROFESSIONAL', label: 'Фаховий' },
                            { key: 'PDFC', label: 'Вільний вибір' },
                        ].map(({ key, label }) => (
                            <div key={key} className={cn('flex items-center justify-between gap-3 rounded-ami border px-3.5 py-2.5 text-sm/6 font-black', BLOCK_TYPE_STYLES[key])}>
                                <span className="inline-flex items-center gap-2">
                                    <span className={cn('size-2.5 rounded-full', BLOCK_TYPE_DOT[key])} aria-hidden="true" />
                                    {label}
                                </span>
                                <span className="rounded-ami bg-white/70 px-2 py-0.5 text-xs/4 font-black">{displayBlockBreakdown[key] || 0}</span>
                            </div>
                        ))}
                    </div>
                </AmiPanel>

                {error && (
                    <StatusMessage type="error" message={error} />
                )}

                {loading && (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-live="polite">
                        {Array.from({ length: degreeLevel === 'bachelor' ? 8 : 4 }).map((_, idx) => (
                            <AmiPanel key={idx} className="p-5">
                                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                                    <div className="ami-skeleton h-7 w-32" />
                                    <div className="ami-skeleton h-5 w-16 rounded-ami" />
                                </div>
                                <div className="mt-4 grid gap-3">
                                    {[0, 1, 2].map((row) => (
                                        <div key={row} className="rounded-ami border border-border bg-soft p-3">
                                            <div className="ami-skeleton h-5 w-3/4" />
                                            <div className="mt-3 flex gap-2">
                                                <div className="ami-skeleton h-5 w-24 rounded-ami" />
                                                <div className="ami-skeleton h-5 w-16 rounded-ami" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AmiPanel>
                        ))}
                    </section>
                )}

                {!loading && !error && filteredSubjects.length === 0 && selectedSpecialty && (
                    <AmiPanel className="flex flex-col items-center gap-4 p-10 text-center">
                        <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
                            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                        </span>
                        <div className="grid gap-1.5">
                            <h3 className="m-0 font-sans text-lg/7 font-black text-ink">Поки що порожньо</h3>
                            <p className="m-0 max-w-md text-sm/6 font-bold text-muted">
                                Для «{selectedSpecialty.name}» немає предметів на рівні {degreeLevel === 'bachelor' ? 'бакалавра' : 'магістра'}.
                            </p>
                        </div>
                        <AmiButton variant="secondary" onClick={() => setDegreeLevel(degreeLevel === 'bachelor' ? 'master' : 'bachelor')}>
                            Спробувати {degreeLevel === 'bachelor' ? 'магістра' : 'бакалавра'}
                        </AmiButton>
                    </AmiPanel>
                )}

                {!loading && !error && filteredSubjects.length > 0 && (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {semesters.map((semester) => {
                            const semesterSubjects = displaySubjectsBySemester[semester] || [];
                            const semesterCredits = getTotalCredits(semesterSubjects.map(s => s.isSelectiveGroup ? s.options?.[0] : s));

                            return (
                                <AmiPanel as="article" key={semester} className="flex flex-col p-5">
                                    <header className="flex items-start justify-between gap-3 border-b border-border pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-11 shrink-0 place-items-center rounded-ami border border-accent/30 bg-accent-soft font-sans text-lg/6 font-black text-accent-strong" aria-hidden="true">
                                                {semester}
                                            </span>
                                            <div>
                                                <h3 className="m-0 font-sans text-lg/6 font-black text-ink">Семестр {semester}</h3>
                                                <p className="m-0 text-xs/5 font-bold text-muted">{formatSubjectCount(semesterSubjects.length)} · {formatCreditCount(semesterCredits)}</p>
                                            </div>
                                        </div>
                                        {isAdmin && selectedSpecialtyId && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSubjectModalConfig({ isOpen: true, item: null, semester: Number(semester) })}
                                                    className="inline-flex size-8 items-center justify-center rounded-md bg-accent-soft text-accent-strong transition-colors hover:bg-accent hover:text-white"
                                                    title="Додати предмет"
                                                >
                                                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                                </button>
                                                <button
                                                    onClick={() => setGroupModalConfig({ isOpen: true, item: null, semester: Number(semester) })}
                                                    className="inline-flex size-8 items-center justify-center rounded-md bg-purple-50 text-purple-600 transition-colors hover:bg-purple-500 hover:text-white"
                                                    title="Додати групу вибору"
                                                >
                                                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                                                </button>
                                            </div>
                                        )}
                                    </header>

                                    {semesterSubjects.length === 0 ? (
                                        <p className="mt-4 rounded-ami border border-dashed border-border bg-soft px-4 py-6 text-center text-sm/6 font-bold text-muted">
                                            Поки немає предметів.
                                        </p>
                                    ) : (
                                        <ul className="mt-4 grid list-none gap-3 p-0">
                                            {semesterSubjects.map((item) => (
                                                <li
                                                    key={item.id}
                                                    className="group relative overflow-hidden rounded-ami border border-border bg-surface p-4 transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:border-accent/40 hover:bg-white hover:shadow-[0_4px_18px_rgb(15_23_42/0.06)] motion-reduce:hover:translate-y-0"
                                                >
                                                    {item.isSelectiveGroup ? (
                                                        <>
                                                            <span className={cn('absolute left-0 top-0 h-full w-1', BLOCK_TYPE_DOT[item.options?.[0]?.blockType] || 'bg-border-strong')} aria-hidden="true" />
                                                            <div className="flex items-start justify-between gap-3 pl-1.5">
                                                                <div>
                                                                    <h4 className="m-0 flex-1 min-w-0 wrap-break-words font-sans text-base/6 font-black text-ink transition group-hover:text-accent-strong">{item.name}</h4>
                                                                    <p className="m-0 text-xs/5 font-bold text-muted">Оберіть {selectiveGroupsMap[item.selectiveGroupId]?.minSelectableSubjects || 1} з {item.options.length}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {isAdmin && (
                                                                        <div className="flex items-center gap-1 mr-2 relative z-20 shrink-0">
                                                                            <button onClick={() => setGroupModalConfig({ isOpen: true, item: selectiveGroupsMap[item.selectiveGroupId], semester: item.semester })} className="inline-flex items-center justify-center p-1 rounded bg-white border border-border text-purple-600 hover:bg-purple-50 transition z-20" title="Редагувати групу">
                                                                                <svg className="size-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                                                <span className="sr-only">Редагувати групу</span>
                                                                            </button>
                                                                            <button onClick={() => handleDeleteGroup(item.selectiveGroupId)} className="inline-flex items-center justify-center p-1 rounded bg-white border border-border text-red-600 hover:bg-red-50 transition z-20" title="Видалити групу">
                                                                                <svg className="size-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                                <span className="sr-only">Видалити групу</span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {item.options?.[0]?.credits != null && (
                                                                        <span className="shrink-0 rounded-ami border border-accent/30 bg-accent-soft px-2.5 py-1 text-xs/4 font-black text-accent-strong">{item.options[0].credits} кр.</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 flex flex-wrap gap-2 pl-1.5">
                                                                <span className={cn('inline-flex items-center gap-1.5 rounded-ami border px-2.5 py-1 text-xs/4 font-black', BLOCK_TYPE_STYLES[item.options?.[0]?.blockType] || 'border-border bg-white text-muted')}>
                                                                    <span className={cn('size-1.5 rounded-full', BLOCK_TYPE_DOT[item.options?.[0]?.blockType] || 'bg-muted')} aria-hidden="true" />
                                                                    {BLOCK_TYPE_SHORT[item.options?.[0]?.blockType] || 'Без блоку'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 pl-1.5">
                                                                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                                                    {item.options.map((opt, idx) => (
                                                                        <li key={opt.id} className="flex items-start gap-2 text-sm/5 font-bold text-muted transition hover:text-ink">
                                                                            <span className="shrink-0 font-black text-accent-strong">{idx + 1}.</span>
                                                                            <span className="flex-1 flex justify-between items-center group/opt relative">
                                                                                <span>
                                                                                    {opt.name}
                                                                                    <span className="ml-2 inline-flex items-center gap-1 opacity-70 text-xs px-1.5 py-0.5 rounded border border-border">
                                                                                        {EXAM_TYPE_LABELS[opt.examType] || 'Без контролю'}
                                                                                        {opt.credits != null ? ` · ${opt.credits} кр.` : ''}
                                                                                    </span>
                                                                                </span>
                                                                                {isAdmin && (
                                                                                    <span className="flex items-center gap-1 z-20 shrink-0">
                                                                                        <button onClick={() => setSubjectModalConfig({ isOpen: true, item: opt, semester: item.semester })} className="inline-flex items-center justify-center p-1 rounded bg-white border border-border text-accent-strong hover:bg-accent-soft transition z-20" title="Редагувати">
                                                                                            <svg className="size-3 text-accent-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                                                            <span className="sr-only">Редагувати предмет</span>
                                                                                        </button>
                                                                                        <button onClick={() => handleDeleteSubject(opt.id)} className="inline-flex items-center justify-center p-1 rounded bg-white border border-border text-red-600 hover:bg-red-50 transition z-20" title="Видалити">
                                                                                            <svg className="size-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                                            <span className="sr-only">Видалити предмет</span>
                                                                                        </button>
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className={cn('absolute left-0 top-0 h-full w-1', BLOCK_TYPE_DOT[item.blockType] || 'bg-border-strong')} aria-hidden="true" />
                                                            <div className="flex items-start justify-between gap-3 pl-1.5">
                                                                <h4 className="m-0 flex-1 min-w-0 wrap-break-words font-sans text-base/6 font-black text-ink transition group-hover:text-accent-strong">{item.name}</h4>
                                                                <div className="flex items-center gap-2">
                                                                    {isAdmin && (
                                                                        <div className="flex items-center gap-1 mr-2 relative z-20 shrink-0">
                                                                            <button onClick={() => setSubjectModalConfig({ isOpen: true, item, semester: item.semester })} className="inline-flex items-center justify-center p-1 rounded bg-white border border-border text-accent-strong hover:bg-accent-soft transition z-20" title="Редагувати предмет">
                                                                                <svg className="size-4 text-accent-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                                                <span className="sr-only">Редагувати предмет</span>
                                                                            </button>
                                                                            <button onClick={() => handleDeleteSubject(item.id)} className="inline-flex items-center justify-center p-1 rounded bg-white border border-border text-red-600 hover:bg-red-50 transition z-20" title="Видалити предмет">
                                                                                <svg className="size-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                                <span className="sr-only">Видалити предмет</span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {item.credits != null && (
                                                                        <span className="shrink-0 rounded-ami border border-accent/30 bg-accent-soft px-2.5 py-1 text-xs/4 font-black text-accent-strong">{item.credits} кр.</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 flex flex-wrap gap-2 pl-1.5">
                                                                <span className={cn('inline-flex items-center gap-1.5 rounded-ami border px-2.5 py-1 text-xs/4 font-black', BLOCK_TYPE_STYLES[item.blockType] || 'border-border bg-white text-muted')}>
                                                                    <span className={cn('size-1.5 rounded-full', BLOCK_TYPE_DOT[item.blockType] || 'bg-muted')} aria-hidden="true" />
                                                                    {BLOCK_TYPE_SHORT[item.blockType] || 'Без блоку'}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-xs/4 font-black text-muted">
                                                                    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                        <path d="M9 11.5 11 13.5l4-4" /><circle cx="12" cy="12" r="9" />
                                                                    </svg>
                                                                    {EXAM_TYPE_LABELS[item.examType] || 'Без контролю'}
                                                                </span>
                                                            </div>

                                                            {item.taughtBy && (
                                                                <p className="m-0 mt-3 pl-1.5 text-xs/5 font-bold text-muted">
                                                                    <span className="text-ink">Викладач:</span> {item.taughtBy}
                                                                </p>
                                                            )}

                                                            {item.syllabusLink && (
                                                                <AmiButton
                                                                    as="a"
                                                                    href={item.syllabusLink}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    variant="soft"
                                                                    size="sm"
                                                                    className="mt-3 ml-1.5 no-underline"
                                                                >
                                                                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                                                        <path d="M14 2v6h6M9 13h6M9 17h6" />
                                                                    </svg>
                                                                    Силабус
                                                                </AmiButton>
                                                            )}
                                                        </>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </AmiPanel>
                            );
                        })}
                    </section>
                )}
            </AmiContainer>
            <Footer />
            {isAdmin && (
                <>
                    <SubjectModal
                        isOpen={subjectModalConfig.isOpen}
                        onClose={() => setSubjectModalConfig({ isOpen: false, item: null, semester: 1 })}
                        initialData={subjectModalConfig.item}
                        specialties={specialties}
                        selectedSpecialtyId={selectedSpecialtyId}
                        selectedSemester={subjectModalConfig.semester}
                        selectiveGroups={selectiveGroups}
                        onSaved={(savedItem, action) => {
                            if (action === 'create') {
                                setSubjects(prev => [...prev, savedItem]);
                            } else {
                                setSubjects(prev => prev.map(s => s.id === savedItem.id ? savedItem : s));
                            }
                        }}
                    />
                    <SelectiveGroupModal
                        isOpen={groupModalConfig.isOpen}
                        onClose={() => setGroupModalConfig({ isOpen: false, item: null, semester: 1 })}
                        initialData={groupModalConfig.item}
                        specialties={specialties}
                        selectedSemester={groupModalConfig.semester}
                        onSaved={(savedItem, action) => {
                            if (action === 'create') {
                                setSelectiveGroups(prev => [...prev, savedItem]);
                            } else {
                                setSelectiveGroups(prev => prev.map(g => g.id === savedItem.id ? savedItem : g));
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
}

export default CourseMapPage;
