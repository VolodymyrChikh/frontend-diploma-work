import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AboutSpecialty from '../../components/AboutSpecialtyContainer/AboutSpecialty';
import { AmiButton, AmiContainer } from '../../ui/ami.jsx';
import { cn } from '../../ui/cn.js';

const SPECIALTIES = [
    {
        code: '014',
        label: 'A4',
        name: 'Середня освіта',
        fullName: 'Середня освіта (Інформатика)',
        accent: 'amber',
        description: (
            <>
                Ця освітня програма спрямована на <span className="font-black text-accent-strong">підготовку фахівців</span>,
                здатних ефективно поєднувати <span className="font-black text-accent-strong">знання з інформатики та педагогіки</span>.
                Випускники отримують поглиблені теоретичні та практичні знання,
                що дозволяють їм викладати інформатику в закладах середньої освіти
                та впроваджувати інноваційні освітні технології.
            </>
        ),
        whatYouLearn: [
            'Основи програмування мовами Python та Java',
            'Вивчення структур даних та алгоритмів',
            'Моделі статистичного навчання',
            'Динамічна теорія інформації: аналіз інформаційних процесів',
            'Розробка програмних продуктів',
            'Методика викладання фахових дисциплін',
            'Педагогічна практика',
        ],
        careerOpportunities: [
            'Вчитель інформатики в закладах середньої освіти',
            'Методист з інформатики в освітніх установах',
            'Розробник навчальних програм та електронних освітніх ресурсів',
            'Консультант з впровадження інформаційних технологій в освіті',
            'Фахівець з цифрової освіти в державних та приватних структурах',
        ],
    },
    {
        code: '113',
        label: 'F1',
        name: 'Прикладна математика',
        fullName: 'Прикладна математика',
        accent: 'sky',
        description: (
            <>
                Ця програма формує мислення аналітика, який може працювати з абстрактними моделями та реальними задачами.
                Прикладна математика — це серце сучасних технологій, яке дозволяє <span className="font-black text-accent-strong">створювати математичні моделі</span> для розв&apos;язання задач у науці, <span className="font-black text-accent-strong">інженерії</span>, економіці та IT.
            </>
        ),
        whatYouLearn: [
            'Дискретна та прикладна математика',
            'Теорія ймовірностей і статистика',
            'Моделювання процесів: створення математичних моделей явищ',
            'Програмування та обробка даних',
            'Методи оптимізації та ML, пошук найкращих рішень та навчання машин',
        ],
        careerOpportunities: [
            'Аналітик даних (Data Analyst)',
            'Спеціаліст з математичного моделювання',
            'Фінансовий аналітик',
            'Розробник алгоритмів',
            'Дослідник у наукових інститутах або R&D',
        ],
    },
    {
        code: '122',
        label: 'F3',
        name: "Комп'ютерні науки",
        fullName: "Комп'ютерні науки",
        accent: 'blue',
        description: (
            <>
                Мрієш створювати <span className="font-black text-accent-strong">власні програми</span>, розробляти штучний інтелект або працювати з передовими комп&apos;ютерними технологіями?
                Комп&apos;ютерні науки — це ключова <span className="font-black text-accent-strong">основа будь-якої сучасної IT-розробки</span>. Обираючи цю спеціальність, ти отримаєш знання та навички, щоб будувати майбутнє цифрового світу.
            </>
        ),
        whatYouLearn: [
            'Алгоритми та дані, як ефективно обробляти інформацію',
            'Програмування, основи та різні мови для розробки',
            'Веб та бази даних, створення сайтів і керування інформацією',
            'Розробка ПЗ, як створювати якісні програми',
            'Штучний інтелект, навчання машин думати та діяти',
        ],
        careerOpportunities: [
            'Програміст (Software Engineer)',
            'Розробник AI/ML',
            'Веб-розробник (Web Developer)',
            'Тестувальник ПЗ (QA Engineer)',
            'Фахівець з DevOps, Data Engineer, Game Developer',
        ],
    },
    {
        code: '124',
        label: 'F4',
        name: 'Системний аналіз',
        fullName: 'Системний аналіз',
        accent: 'violet',
        description: (
            <>
                Системний аналітик — це фахівець, який здатен бачити повну картину складних процесів. Він поєднує глибокі технічні знання з чітким <span className="font-black text-accent-strong">розумінням бізнес-операцій</span>.
                Тут готують <span className="font-black text-accent-strong">аналітиків</span>, здатних ефективно працювати з великими інформаційними системами, обробляти значні обсяги даних та вирішувати складні управлінські завдання.
            </>
        ),
        whatYouLearn: [
            'Бізнес-аналіз і проектування систем, розуміння потреб бізнесу',
            'Аналіз даних і управління проєктами',
            'Математичне моделювання, прогнозування та оптимізації',
            'Робота з аналітичними платформами',
            'Інтелектуальний аналіз даних (Data Science)',
        ],
        careerOpportunities: [
            'Системний аналітик',
            'Бізнес-аналітик',
            'Data Analyst / Data Scientist',
            'Менеджер IT-проєктів',
            'Консультант з цифрової трансформації',
        ],
    },
    {
        code: '125',
        label: 'F5',
        name: 'Кібербезпека',
        fullName: 'Кібербезпека та захист інформації',
        accent: 'rose',
        description: (
            <>
                <span className="font-black text-accent-strong">Кібербезпека</span> — це значно більше, ніж просто інформаційні технології. Це динамічна сфера, де щодня ти стоїш на варті цифрових світів, <span className="font-black text-accent-strong">захищаючи їх від різноманітних кібератак</span>.
                Наша програма готує висококваліфікованих фахівців, здатних не лише виявляти та реагувати на загрози, але й активно їх передбачати та ефективно запобігати.
            </>
        ),
        whatYouLearn: [
            'Криптографія та захист, методи шифрування даних',
            'Мережева безпека, захист комп&apos;ютерних мереж',
            'Етичний хакінг, тестування на проникнення систем',
            'Системне адміністрування, керування безпекою інфраструктури',
            'Стандарти безпеки й аудит, норми та перевірка систем',
        ],
        careerOpportunities: [
            'Фахівець з кібербезпеки',
            'Information Security Analyst',
            'Penetration Tester',
            'DevSecOps Engineer',
            'IT-аудитор',
        ],
    },
];

function AboutSpecialtyPage() {
    const specialtyRefs = useRef({});
    const stickyNavRef = useRef(null);
    const [activeCode, setActiveCode] = useState(SPECIALTIES[0].code);

    const setSpecialtyRefs = (...keys) => (element) => {
        keys.forEach((key) => {
            specialtyRefs.current[key] = element;
        });
    };

    const scrollToSpecialty = (code, smooth = true) => {
        const node = specialtyRefs.current[code];
        if (!node) return;

        const headerHeight = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
            10,
        ) || 64;
        const stickyNavHeight = stickyNavRef.current?.offsetHeight ?? 0;
        const breathingRoom = 16;
        const offset = headerHeight + stickyNavHeight + breathingRoom;

        const targetTop = node.getBoundingClientRect().top + window.pageYOffset - offset;

        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: smooth && !prefersReducedMotion ? 'smooth' : 'auto',
        });
    };

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash) return;
        const specialtyKey = hash.replace('#specialty-', '');
        if (specialtyRefs.current[specialtyKey]) {
            const id = window.requestAnimationFrame(() => {
                scrollToSpecialty(specialtyKey, false);
            });
            return () => window.cancelAnimationFrame(id);
        }
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible) {
                    const code = visible.target.dataset.specialtyCode;
                    if (code) setActiveCode(code);
                }
            },
            { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.3, 0.6, 1] },
        );

        SPECIALTIES.forEach((specialty) => {
            const node = specialtyRefs.current[specialty.code];
            if (node) observer.observe(node);
        });

        return () => observer.disconnect();
    }, []);

    const handleNavClick = (code) => (event) => {
        event.preventDefault();
        scrollToSpecialty(code, true);
        history.replaceState(null, '', `#specialty-${code}`);
    };

    return (
        <div className="min-h-dvh bg-page text-ink">
            <Header />

            <section className="border-b border-border bg-linear-to-b from-accent-soft/60 to-transparent">
                <AmiContainer className="grid gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="grid min-w-0 gap-4">
                        <h1 className="m-0 font-sans text-[clamp(2rem,4.5vw,3.25rem)]/[1.05] font-black text-ink">
                            Спеціальності факультету
                        </h1>
                        <p className="m-0 max-w-2xl text-base/7 font-bold text-muted md:text-lg/8">
                            Коротко про напрямки, що вивчають та ким можна стати після випуску. Знайди свій маршрут — і подивись карту курсів програми.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 lg:justify-end">
                        <AmiButton as={Link} to="/course-map" variant="secondary" size="lg" className="no-underline">
                            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M2 3v18l7-3 6 3 7-3V0l-7 3-6-3-7 3Z" />
                                <path d="M9 0v18M15 6v18" />
                            </svg>
                            Карта курсів
                        </AmiButton>
                    </div>
                </AmiContainer>
            </section>

            <div ref={stickyNavRef} className="sticky top-(--header-height) z-30 border-b border-border bg-white/85 backdrop-blur supports-backdrop-filter:bg-white/70">
                <AmiContainer>
                    <nav aria-label="Навігація спеціальностями" className="flex items-center gap-2 overflow-x-auto py-3">
                        {SPECIALTIES.map((specialty) => {
                            const isActive = activeCode === specialty.code;
                            return (
                                <a
                                    key={specialty.code}
                                    href={`#specialty-${specialty.code}`}
                                    onClick={handleNavClick(specialty.code)}
                                    aria-current={isActive ? 'true' : undefined}
                                    className={cn(
                                        'inline-flex shrink-0 items-center gap-2 rounded-ami border px-4 py-2 text-sm/6 font-extrabold no-underline transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)',
                                        isActive
                                            ? 'border-accent/45 bg-accent text-white shadow-[0_2px_8px_rgb(155_77_87/0.25)]'
                                            : 'border-border bg-white text-muted hover:border-accent/40 hover:bg-accent-soft hover:text-accent-strong',
                                    )}
                                >
                                    <span className={cn('inline-grid size-6 place-items-center rounded-ami font-sans text-xs/4 font-black', isActive ? 'bg-white/25 text-white' : 'bg-soft text-ink')}>
                                        {specialty.label}
                                    </span>
                                    <span>{specialty.name}</span>
                                </a>
                            );
                        })}
                    </nav>
                </AmiContainer>
            </div>

            <AmiContainer className="grid gap-8 py-10 lg:gap-10">
                {SPECIALTIES.map((specialty) => (
                    <section
                        key={specialty.code}
                        id={`specialty-${specialty.code}`}
                        ref={setSpecialtyRefs(specialty.code, specialty.label)}
                        data-specialty-code={specialty.code}
                        data-specialty-accent={specialty.accent}
                        className="scroll-mt-44 grid gap-4"
                    >
                        <AboutSpecialty
                            specialtyNumber={specialty.label}
                            specialtyName={specialty.fullName}
                            text={specialty.description}
                            whatYouLearn={specialty.whatYouLearn}
                            careerOpportunities={specialty.careerOpportunities}
                        />
                        <div className="flex flex-wrap gap-3">
                            <AmiButton
                                as={Link}
                                to={`/course-map?specialty=${specialty.code}&level=bachelor`}
                                size="lg"
                                className="no-underline"
                            >
                                Переглянути карту курсів
                                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 12h14M13 5l7 7-7 7" />
                                </svg>
                            </AmiButton>
                            <AmiButton
                                as={Link}
                                to={`/forum?category=${encodeURIComponent(specialty.name)}`}
                                variant="secondary"
                                size="lg"
                                className="no-underline"
                            >
                                Обговорення на форумі
                            </AmiButton>
                        </div>
                    </section>
                ))}
            </AmiContainer>

            <Footer />
        </div>
    );
}

export default AboutSpecialtyPage;
