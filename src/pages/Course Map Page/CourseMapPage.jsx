import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { apiFetch } from '../../api/client';
import { extractCollectionPayload, readJsonPayload } from '../../utils/apiPayload.js';
import { formatCreditCount, formatSubjectCount, getTotalCredits } from '../../utils/courseMap.js';
import { AmiButton, AmiContainer, AmiPanel } from '../../ui/ami.jsx';
import { cn } from '../../ui/cn.js';

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

function CourseMapPage() {
    const [searchParams] = useSearchParams();
    const levelFromUrl = searchParams.get('level');
    const specialtyFromUrl = searchParams.get('specialty');

    const [degreeLevel, setDegreeLevel] = useState(levelFromUrl === 'master' ? 'master' : 'bachelor');
    const [specialties, setSpecialties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                const [specialtiesRes, subjectsRes] = await Promise.all([
                    apiFetch('/specialties?size=200'),
                    apiFetch('/subjects?size=2000&sort=semester,asc')
                ]);

                if (!specialtiesRes.ok) {
                    throw new Error('Не вдалося завантажити спеціальності.');
                }

                if (!subjectsRes.ok) {
                    throw new Error('Не вдалося завантажити предмети.');
                }

                const specialtiesPayload = await readJsonPayload(specialtiesRes);
                const subjectsPayload = await readJsonPayload(subjectsRes);

                if (!isMounted) {
                    return;
                }

                if (!specialtiesPayload || !subjectsPayload) {
                    throw new Error('Не вдалося прочитати дані карти курсів. Перевір, чи працює сервер.');
                }

                const loadedSpecialties = extractCollectionPayload(specialtiesPayload);
                const loadedSubjects = extractCollectionPayload(subjectsPayload);
                const loadedVisibleSpecialties = loadedSpecialties.filter((specialty) => specialty.id !== 12);

                setSpecialties(loadedSpecialties);
                setSubjects(loadedSubjects);

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
    
    const semesters = degreeLevel === 'bachelor'
        ? [1, 2, 3, 4, 5, 6, 7, 8]
        : [1, 2, 3, 4];
    const totalCredits = getTotalCredits(filteredSubjects);
    const selectedDegreeLabel = degreeLevel === 'bachelor' ? 'Бакалавр' : 'Магістр';

    const blockBreakdown = useMemo(() => {
        const counts = { HUMANITARIAN: 0, SCIENTIFIC: 0, PROFESSIONAL: 0, PDFC: 0, OTHER: 0 };
        filteredSubjects.forEach((subject) => {
            const key = subject.blockType in counts ? subject.blockType : 'OTHER';
            counts[key] += 1;
        });
        return counts;
    }, [filteredSubjects]);

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
                                <dd className="m-0 mt-1 font-sans text-base/6 font-black text-ink">{filteredSubjects.length}</dd>
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
                        <span className="text-xs/5 font-bold text-muted">{filteredSubjects.length} предметів у поточному виборі</span>
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
                                <span className="rounded-ami bg-white/70 px-2 py-0.5 text-xs/4 font-black">{blockBreakdown[key] || 0}</span>
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
                            const semesterSubjects = subjectsBySemester[semester] || [];
                            const semesterCredits = getTotalCredits(semesterSubjects);

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
                                    </header>

                                    {semesterSubjects.length === 0 ? (
                                        <p className="mt-4 rounded-ami border border-dashed border-border bg-soft px-4 py-6 text-center text-sm/6 font-bold text-muted">
                                            Поки немає предметів.
                                        </p>
                                    ) : (
                                        <ul className="mt-4 grid list-none gap-3 p-0">
                                            {semesterSubjects.map((subject) => (
                                                <li
                                                    key={subject.id}
                                                    className="group relative overflow-hidden rounded-ami border border-border bg-surface p-4 transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:border-accent/40 hover:bg-white hover:shadow-[0_4px_18px_rgb(15_23_42/0.06)] motion-reduce:hover:translate-y-0"
                                                >
                                                    <span className={cn('absolute left-0 top-0 h-full w-1', BLOCK_TYPE_DOT[subject.blockType] || 'bg-border-strong')} aria-hidden="true" />
                                                    <div className="flex items-start justify-between gap-3 pl-1.5">
                                                        <h4 className="m-0 font-sans text-base/6 font-black text-ink transition group-hover:text-accent-strong">{subject.name}</h4>
                                                        {subject.credits != null && (
                                                            <span className="shrink-0 rounded-ami border border-accent/30 bg-accent-soft px-2.5 py-1 text-xs/4 font-black text-accent-strong">{subject.credits} кр.</span>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap gap-2 pl-1.5">
                                                        <span className={cn('inline-flex items-center gap-1.5 rounded-ami border px-2.5 py-1 text-xs/4 font-black', BLOCK_TYPE_STYLES[subject.blockType] || 'border-border bg-white text-muted')}>
                                                            <span className={cn('size-1.5 rounded-full', BLOCK_TYPE_DOT[subject.blockType] || 'bg-muted')} aria-hidden="true" />
                                                            {BLOCK_TYPE_SHORT[subject.blockType] || 'Без блоку'}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-xs/4 font-black text-muted">
                                                            <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                <path d="M9 11.5 11 13.5l4-4" /><circle cx="12" cy="12" r="9" />
                                                            </svg>
                                                            {EXAM_TYPE_LABELS[subject.examType] || 'Без контролю'}
                                                        </span>
                                                    </div>

                                                    {subject.taughtBy && (
                                                        <p className="m-0 mt-3 pl-1.5 text-xs/5 font-bold text-muted">
                                                            <span className="text-ink">Викладач:</span> {subject.taughtBy}
                                                        </p>
                                                    )}

                                                    {/* {subject.description && (
                                                        <p className="m-0 mt-2 pl-1.5 text-sm/5 font-bold text-text">{subject.description}</p>
                                                    )} */}

                                                    {subject.syllabusLink && (
                                                        <AmiButton
                                                            as="a"
                                                            href={subject.syllabusLink}
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
        </div>
    );
}

export default CourseMapPage;
