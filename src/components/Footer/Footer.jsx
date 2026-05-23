import { Link } from 'react-router-dom';
import { AmiContainer } from '../../ui/ami.jsx';

const NAV_ITEMS = [
    ['Головна', '/main'],
    ['Розклад', '/schedule'],
    ['Про спеціальності', '/about-specialties'],
    ['Карта курсів', '/course-map'],
    ['Медіатека', '/media'],
    ['Форум', '/forum'],
    ['Профіль', '/profile'],
];

const SOCIAL_LINKS = [
    {
        label: 'Telegram',
        href: 'https://t.me/ami_lnu',
        icon: (
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                <path d="M9.78 18.65 10.06 14.42 17.74 7.5C18.08 7.19 17.67 7.04 17.22 7.31L7.74 13.3 3.64 12C2.76 11.75 2.75 11.14 3.84 10.7L19.81 4.54C20.54 4.21 21.24 4.72 20.96 5.84L18.24 18.65C18.05 19.56 17.5 19.78 16.74 19.36L12.6 16.3 10.61 18.23C10.38 18.46 10.19 18.65 9.78 18.65Z" />
            </svg>
        ),
    },
    {
        label: 'TikTok',
        href: 'https://www.tiktok.com/@ami_lnu',
        icon: (
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.78a8.16 8.16 0 0 0 4.77 1.52V6.85a4.85 4.85 0 0 1-1.84-.16Z" />
            </svg>
        ),
    },
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/ami_lnu/',
        icon: (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M16 11.37a4 4 0 1 1-7.91 1.18A4 4 0 0 1 16 11.37Z" />
                <path d="M17.5 6.5h.01" />
            </svg>
        ),
    },
    {
        label: 'YouTube',
        href: 'https://www.youtube.com/@ami_lnu',
        icon: (
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                <path d="M23 12s0-3.69-.47-5.46a2.78 2.78 0 0 0-1.95-1.95C18.81 4.12 12 4.12 12 4.12s-6.81 0-8.58.47A2.78 2.78 0 0 0 1.47 6.54C1 8.31 1 12 1 12s0 3.69.47 5.46a2.78 2.78 0 0 0 1.95 1.95c1.77.47 8.58.47 8.58.47s6.81 0 8.58-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.69 23 12 23 12ZM9.75 15.5v-7l6 3.5-6 3.5Z" />
            </svg>
        ),
    },
];

function Footer() {
    return (
        <footer className="border-t border-border bg-white text-ink">
            <AmiContainer className="grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr_1fr_1fr] lg:gap-8 lg:py-14">
                {/* Brand */}
                <div className="grid gap-4">
                    <Link to="/main" className="inline-flex w-fit items-center gap-2.5 no-underline">
                        <span className="font-sans text-xl/7 font-black text-ink">
                            <span className="text-accent-strong">AMI</span> Portal
                        </span>
                    </Link>
                    <p className="m-0 max-w-sm text-sm/6 font-bold text-muted">
                        AMI Portal для студентів ФПМІ ЛНУ: форум, медіатека й карта курсів.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2" aria-label="Соцмережі">
                        {SOCIAL_LINKS.map(({ label, href, icon }) => (
                            <a
                                key={href}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                className="grid size-10 place-items-center rounded-ami border border-border bg-white text-muted transition-[background-color,border-color,color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) motion-reduce:hover:translate-y-0"
                            >
                                {icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <nav aria-label="Нижня навігація">
                    <h3 className="m-0 font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Навігація</h3>
                    <ul className="m-0 mt-4 grid list-none gap-2 p-0">
                        {NAV_ITEMS.map(([label, to]) => (
                            <li key={to}>
                                <Link
                                    to={to}
                                    className="inline-flex items-center gap-1.5 text-sm/6 font-extrabold text-text no-underline transition hover:text-accent-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                                >
                                    <span className="size-1 rounded-full bg-border-strong transition group-hover:bg-accent" aria-hidden="true" />
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Student council */}
                <div>
                    <h3 className="m-0 font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Студентська рада</h3>
                    <ul className="m-0 mt-4 grid list-none gap-3 p-0 text-sm/6 font-bold">
                        <li>
                            <a
                                href="mailto:student.counsil@lnu.edu.ua?subject=Привіт%20від%20ФПМІ"
                                className="inline-flex items-center gap-2 text-text no-underline transition hover:text-accent-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                            >
                                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                    <path d="m3 7 9 6 9-6" />
                                </svg>
                                <span className="min-w-0 truncate">student.counsil@lnu.edu.ua</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="tel:+380938572398"
                                className="inline-flex items-center gap-2 text-text no-underline transition hover:text-accent-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                            >
                                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M22 16.92V21a1 1 0 0 1-1.09 1A19.79 19.79 0 0 1 2 4.09 1 1 0 0 1 3 3h4.09a1 1 0 0 1 1 .75L9 7a1 1 0 0 1-.27 1L7 9.5a16 16 0 0 0 7.5 7.5l1.5-1.73A1 1 0 0 1 17 15l3.25.91a1 1 0 0 1 .75 1Z" />
                                </svg>
                                +38 (093) 857-23-98
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Dean's office */}
                <div>
                    <h3 className="m-0 font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Деканат ФПМІ</h3>
                    <ul className="m-0 mt-4 grid list-none gap-3 p-0 text-sm/6 font-bold">
                        <li>
                            <a
                                href="mailto:ami.faculty@lnu.edu.ua?subject=Привіт%20від%20ФПМІ"
                                className="inline-flex items-center gap-2 text-text no-underline transition hover:text-accent-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                            >
                                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                    <path d="m3 7 9 6 9-6" />
                                </svg>
                                <span className="min-w-0 truncate">ami.faculty@lnu.edu.ua</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="tel:+380322394727"
                                className="inline-flex items-center gap-2 text-text no-underline transition hover:text-accent-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                            >
                                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M22 16.92V21a1 1 0 0 1-1.09 1A19.79 19.79 0 0 1 2 4.09 1 1 0 0 1 3 3h4.09a1 1 0 0 1 1 .75L9 7a1 1 0 0 1-.27 1L7 9.5a16 16 0 0 0 7.5 7.5l1.5-1.73A1 1 0 0 1 17 15l3.25.91a1 1 0 0 1 .75 1Z" />
                                </svg>
                                +38 (032) 239-47-27
                            </a>
                        </li>
                        <li>
                            <span className="inline-flex items-start gap-2 text-muted">
                                <svg viewBox="0 0 24 24" className="size-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>вул. Університетська, 1<br />ФПМІ, ЛНУ ім. Івана Франка</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </AmiContainer>

            <div className="border-t border-border bg-soft">
                <AmiContainer className="flex flex-wrap items-center justify-between gap-3 py-5 text-xs/5 font-bold text-muted select-none">
                    <span>&copy; {new Date().getFullYear()} AMI Portal · ФПМІ ЛНУ ім. Івана Франка</span>
                </AmiContainer>
            </div>
        </footer>
    );
}

export default Footer;
