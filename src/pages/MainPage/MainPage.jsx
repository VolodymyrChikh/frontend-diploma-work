import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import AboutSpecialtyCard from "../../components/AboutSpecialtiesCard/AboutSpecialtyCard";
import specialty113 from '../../assets/images/113.png';
import specialty122 from '../../assets/images/122.png';
import specialty124 from '../../assets/images/124.png';
import specialty014 from '../../assets/images/014.png';
import specialty125 from '../../assets/images/125.png';
import mainPageImage from '../../assets/images/mainPageFpmiImage.jpg';
import StatusMessage from "../../components/StatusMessage/StatusMessage";
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { createStatus, getErrorMessage } from '../../utils/messages.js';
import { extractArray, extractPageContent } from '../../utils/apiPayload.js';
import { AmiButton, AmiContainer, AmiPanel } from '../../ui/ami.jsx';
import { cn } from '../../ui/cn.js';

const PORTAL_AREAS = [
  {
    title: 'Форум',
    description: 'Питання по парах, сесії й факультетських справах.',
    to: '/forum',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Медіатека',
    description: 'Конспекти, посилання й файли від студентів.',
    to: '/media',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
      </svg>
    ),
  },
  {
    title: 'Карта курсів',
    description: 'Предмети за семестрами без зайвих пошуків.',
    to: '/course-map',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18 3 15V4l6 3 6-3 6 3v11l-6-3-6 3Z" />
        <path d="M9 7v11M15 4v11" />
      </svg>
    ),
  },
  {
    title: 'Спеціальності',
    description: 'Коротко про напрями ФПМІ та вступ.',
    to: '/about-specialties',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    ),
  },
];

function MainPage() {
  const location = useLocation();

  const mainImageAlt = "Студенти факультету прикладної математики та інформатики";

  const [specialties, setSpecialties] = useState([]);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [status, setStatus] = useState(null);
  const [faqStatus, setFaqStatus] = useState(null);
  const [faqLoading, setFaqLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setSpecialtiesLoading(true);
        const response = await api.get('/specialties');
        const filteredSpecialties = extractPageContent(response.data).filter(
          specialty => specialty.number !== null && specialty.about !== null
        );
        const sortedSpecialties = filteredSpecialties.sort((a, b) => a.number.localeCompare(b.number));
        setSpecialties(sortedSpecialties);
      } catch (error) {
        console.error('Error fetching specialties:', error);
        setStatus(createStatus('error', 'Не вдалося завантажити спеціальності'));
      } finally {
        setSpecialtiesLoading(false);
      }
    };

    const fetchFaqs = async () => {
      try {
        setFaqLoading(true);
        setFaqStatus(null);
        const response = await api.get('/faqs');
        setFaqs(extractArray(response.data));
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqStatus(createStatus('error', getErrorMessage(error, 'Не вдалося завантажити FAQ')));
        setFaqs([]);
      } finally {
        setFaqLoading(false);
      }
    };

    fetchSpecialties();
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const hashId = location.hash.replace('#', '');
    const timeoutId = setTimeout(() => {
      const target = document.getElementById(hashId);
      if (!target) return;
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.hash, specialties.length, faqs.length]);

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const getSpecialtyImage = (number) => {
    switch (String(number)) {
      case "F1": case "113": return specialty113;
      case "F3": case "122": return specialty122;
      case "F4": case "124": return specialty124;
      case "F5": case "125": return specialty125;
      case "A4": case "014": return specialty014;
      default: return null;
    }
  };

  return (
    <>
      <Header />
      <main className="ami-home-main text-text">

        {/* HERO */}
        <section className="relative overflow-hidden">
          <AmiContainer className="relative grid gap-9 py-12 md:py-16 lg:min-h-[540px] lg:grid-cols-[minmax(0,0.92fr)_minmax(380px,1fr)] lg:items-center lg:gap-x-14">
            <div className="min-w-0">
              <h1 className="m-0 max-w-3xl font-display text-[clamp(2.35rem,5vw,4.25rem)]/[1.04] font-black tracking-tight text-ink">
                Спільнота студентів,
                <br className="hidden sm:block" /> що <span className="text-accent-strong">допомагає</span>
              </h1>
              <p className="m-0 mt-5 max-w-2xl text-base/7 font-bold text-muted md:text-lg/8">
                Форум, матеріали й карта курсів для студентів ФПМІ — поруч, коли треба швидко знайти відповідь.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <AmiButton as={Link} to="/forum" size="lg" className="min-w-48 no-underline max-sm:w-full">
                  Перейти до форуму
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </AmiButton>
                <AmiButton as={Link} to="/media" variant="secondary" size="lg" className="min-w-40 no-underline max-sm:w-full">
                  До медіатеки
                </AmiButton>
              </div>
            </div>
            <figure className="relative m-0 min-w-0">
              <div className="relative overflow-hidden rounded-ami border border-white/80 bg-surface-strong shadow-[var(--shadow-ami-lg)] ring-1 ring-ink/5">
                <img className="block aspect-1.55 size-full object-cover" src={mainPageImage} alt={mainImageAlt} />
              </div>
            </figure>
          </AmiContainer>
        </section>

        {/* PORTAL AREAS */}
        <AmiContainer as="section" className="relative z-10 -mt-7 grid gap-3 pb-10 pt-0 sm:grid-cols-2 xl:grid-cols-4" aria-label="Розділи порталу">
          {PORTAL_AREAS.map((area) => (
            <AmiPanel key={area.title} as={Link} to={area.to} className="group flex min-h-32 items-center gap-4 bg-white/95 px-5 py-5 text-ink no-underline shadow-[var(--shadow-ami-sm)] backdrop-blur transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[var(--shadow-ami-md)] motion-reduce:hover:translate-y-0">
              <span className="grid size-12 shrink-0 place-items-center rounded-ami border border-accent/25 bg-accent-soft text-accent-strong [&_svg]:size-6">
                {area.icon}
              </span>
              <span className="grid min-w-0">
                <strong className="font-sans text-lg/7 font-black text-ink">{area.title}</strong>
                <span className="mt-1 text-sm/6 font-bold text-muted">{area.description}</span>
              </span>
              <svg className="ml-auto size-4 shrink-0 text-muted transition group-hover:text-accent-strong" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </AmiPanel>
          ))}
        </AmiContainer>

        {/* SPECIALTIES */}
        <AmiContainer as="section" className="py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="m-0 font-sans text-3xl/10 font-black text-ink sm:text-4xl/12">
                Про спеціальності
              </h2>
              <p className="m-0 mt-3 text-base/7 font-bold text-muted md:text-lg/8">
                Коротко про напрями, які формують технічне ядро факультету.
              </p>
            </div>
            <AmiButton as={Link} to="/about-specialties" variant="secondary" className="no-underline max-sm:hidden">
              Усі спеціальності
            </AmiButton>
          </div>

          {status?.message && (
            <div className="mt-6">
              <StatusMessage type={status?.type} message={status?.message} onDismiss={() => setStatus(null)} />
            </div>
          )}

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {specialtiesLoading && (
              [0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex h-full flex-col overflow-hidden rounded-ami border border-border bg-surface-strong">
                  <div className="ami-skeleton aspect-16/10 w-full" />
                  <div className="grid gap-3 p-5">
                    <div className="ami-skeleton h-5 w-3/4" />
                    <div className="ami-skeleton h-4 w-full" />
                    <div className="ami-skeleton h-4 w-2/3" />
                  </div>
                </div>
              ))
            )}
            {!specialtiesLoading && specialties.map(specialty => (
              <Link
                key={specialty.number}
                to={`/about-specialties#specialty-${specialty.number}`}
                className="min-w-0 text-inherit no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus) rounded-ami"
              >
                <AboutSpecialtyCard
                  specialtyImage={getSpecialtyImage(specialty.number)}
                  imageTitle={`${specialty.number} – ${specialty.name}`}
                  imageText={specialty.about}
                />
              </Link>
            ))}
          </div>

          <div className="mt-8 flex justify-center sm:hidden">
            <AmiButton as={Link} to="/about-specialties" variant="secondary" size="lg" className="w-full no-underline">
              Усі спеціальності
            </AmiButton>
          </div>
        </AmiContainer>

        {/* CTA BANNER */}
        <AmiContainer as="section" className="py-8">
          <div className="relative isolate overflow-hidden rounded-ami border border-accent/40 bg-[linear-gradient(135deg,var(--color-accent)_0%,var(--color-accent-strong)_58%,#542c32_100%)] text-white shadow-[0_30px_70px_-20px_rgb(155_77_87/0.55)]">
            {/* decorative layers */}
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
              <svg className="absolute inset-0 size-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="cta-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.2" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cta-dots)" />
              </svg>
              <div className="absolute inset-y-0 right-0 hidden w-1/3 skew-x-[-16deg] border-l border-white/15 bg-white/8 lg:block" />
            </div>

            <div className="relative grid gap-10 p-8 sm:p-10 md:p-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
              {/* LEFT — copy */}
              <div className="min-w-0">
                <h2 className="m-0 font-sans text-[clamp(2rem,3.6vw,3.5rem)]/[1.05] font-black tracking-tight text-white">
                  Хочеш бути частиною <span className="whitespace-nowrap">ФПМІ?</span>
                </h2>
                <p className="m-0 mt-4 max-w-xl text-base/7 font-bold text-white/85 md:text-lg/8">
                  Вже навчаєшся на факультеті чи тільки придивляєшся — тут зібрані речі, які справді виручають у навчанні.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="https://ami.lnu.edu.ua"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-ami border border-white bg-white px-6 text-sm/6 font-black text-accent-strong no-underline shadow-[0_12px_30px_rgb(0_0_0/0.18)] transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgb(0_0_0/0.22)] active:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white motion-reduce:hover:translate-y-0 sm:text-base/7"
                  >
                    Приєднатися
                    <svg viewBox="0 0 24 24" className="size-5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </a>
                  <Link
                    to="/about-specialties"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-ami border border-white/35 bg-white/0 px-6 text-sm/6 font-black text-white no-underline transition-[background-color,border-color] duration-200 ease-out hover:border-white/60 hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white/60 sm:text-base/7"
                  >
                    Про спеціальності
                  </Link>
                </div>

              </div>

              {/* RIGHT — feature cards */}
              <ul className="relative m-0 grid list-none gap-3 p-0">
                {[
                  {
                    title: 'Студентські обговорення',
                    desc: 'Питання по парах, викладачах і сесії',
                    icon: (
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                        <circle cx="10" cy="7" r="4" />
                        <path d="M21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Карта курсів',
                    desc: 'Предмети й семестри без зайвого хаосу',
                    icon: (
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3v18l7-3 6 3 7-3V0l-7 3-6-3-7 3Z" />
                        <path d="M9 0v18M15 6v18" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Медіатека',
                    desc: 'Конспекти, лінки й відео від своїх',
                    icon: (
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
                      </svg>
                    ),
                  },
                ].map(({ title, desc, icon }) => (
                  <li
                    key={title}
                    className="group flex items-start gap-3 rounded-ami border border-white/70 bg-white/92 p-4 text-ink shadow-[0_14px_36px_rgb(39_20_24/0.14)] transition-[background-color,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white motion-reduce:hover:translate-y-0"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-ami bg-accent text-white shadow-[0_10px_24px_rgb(155_77_87/0.28)]" aria-hidden="true">
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <strong className="block font-sans text-base/6 font-black text-ink">{title}</strong>
                      <span className="block text-sm/5 font-bold text-muted">{desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AmiContainer>

        {/* FAQ */}
        <AmiContainer as="section" className="py-12" aria-labelledby="faq">
          <div className="max-w-3xl">
            <h2 id="faq" className="m-0 font-sans text-3xl/10 font-black text-ink sm:text-4xl/12">
              Часті запитання
            </h2>
            <p className="m-0 mt-3 text-base/7 font-bold text-muted md:text-lg/8">
              Короткі відповіді на питання, які найчастіше виникають перед вступом і під час навчання.
            </p>
          </div>

          {faqStatus?.message && (
            <div className="mt-6">
              <StatusMessage type={faqStatus?.type} message={faqStatus?.message} onDismiss={() => setFaqStatus(null)} />
            </div>
          )}

          <div className="mt-7 grid gap-3">
            {faqLoading && [0, 1, 2].map((i) => (
              <div key={i} className="grid gap-3 rounded-ami border border-border bg-surface-strong p-6">
                <div className="ami-skeleton h-5 w-2/3" />
                <div className="ami-skeleton h-4 w-1/2" />
              </div>
            ))}

            {!faqLoading && faqs.length === 0 && (
              <AmiPanel className="flex flex-col items-center gap-3 p-10 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.1 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                  </svg>
                </span>
                <h3 className="m-0 font-sans text-lg/7 font-black text-ink">FAQ поки порожній</h3>
                <p className="m-0 max-w-md text-sm/6 font-bold text-muted">
                  Питання з'являться тут після наповнення бази.
                </p>
              </AmiPanel>
            )}

            {!faqLoading && faqs.map((faq, index) => {
              const isOpen = openFaqId === faq.id;
              const panelId = `faq-answer-${faq.id}`;

              return (
                <article
                  key={faq.id}
                  className={cn(
                    'overflow-hidden rounded-ami border bg-surface-strong transition-[border-color,box-shadow] duration-200',
                    isOpen ? 'border-accent/45 shadow-[0_8px_24px_rgb(15_23_42/0.06)]' : 'border-border',
                  )}
                >
                  <button
                    type="button"
                    className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-0 bg-transparent p-5 text-left text-ink transition-[background-color] duration-200 hover:bg-accent-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) sm:p-6"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className={cn(
                      'grid size-9 place-items-center rounded-ami font-sans text-sm/5 font-black transition duration-200',
                      isOpen ? 'bg-accent text-white' : 'bg-accent-soft text-accent-strong',
                    )}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-sans text-base/7 font-black sm:text-lg/8">{faq.question}</span>
                    <span
                      className={cn(
                        'grid size-9 place-items-center rounded-ami border border-border bg-soft text-muted transition-transform duration-200',
                        isOpen && 'rotate-180 border-accent/35 bg-accent-soft text-accent-strong',
                      )}
                      aria-hidden="true"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                  <div
                    id={panelId}
                    className={cn(
                      'grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="min-h-0">
                      <div className="border-t border-border px-5 py-5 sm:px-6">
                        <p className="m-0 text-base/7 font-bold text-text">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </AmiContainer>
      </main>

      <Footer />
    </>
  );
}

export default MainPage;
