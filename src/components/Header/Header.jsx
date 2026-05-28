import { useContext, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import NotificationPopup from '../NotificationPopup/NotificationPopup';
import { AuthContext } from '../../context/auth-context.js';
import { createSignInRedirect } from '../../auth/guards.js';
import { AmiContainer, AmiIconButton } from '../../ui/ami.jsx';
import { cn } from '../../ui/cn.js';

const desktopNavLinkBaseClass = 'relative inline-flex min-h-9 items-center rounded-ami border px-3.5 text-sm/6 font-extrabold no-underline transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus)';
const desktopNavLinkInactiveClass = 'border-transparent bg-transparent text-muted hover:border-border hover:bg-soft hover:text-ink';
const desktopNavLinkActiveClass = 'border-accent/35 bg-white text-accent-strong shadow-[0_8px_20px_rgb(155_77_87/0.10)]';
const mobileNavLinkBaseClass = 'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-ami border px-1 text-[10px]/4 font-extrabold no-underline transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus)';
const mobileNavLinkInactiveClass = 'border-transparent bg-transparent text-muted hover:border-border hover:bg-soft hover:text-ink';
const mobileNavLinkActiveClass = 'border-accent/40 bg-accent-soft text-accent-strong';

function BrandMark() {
    return (
        <span className="grid size-8 place-items-center rounded-ami border border-accent/35 bg-accent-soft text-accent" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-5" focusable="false">
                <path d="M12 2.7 20 6.1v5.8c0 5.1-3.3 8.4-8 9.9-4.7-1.5-8-4.8-8-9.9V6.1l8-3.4Z" fill="rgb(155 77 87 / 0.12)" stroke="currentColor" strokeWidth="1.45" />
                <path d="M8.4 13.6 12 7.4l3.6 6.2M9.7 11.5h4.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
        </span>
    );
}

function BottomIcon({ type }) {
    const common = 'size-4';
    if (type === 'home') {
        return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 11 8-7 8 7" /><path d="M6.5 10.5V20h11v-9.5" /></svg>;
    }
    if (type === 'forum') {
        return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8.5h14M5 13h9" /><path d="M4 5h16v11H9l-5 4V5Z" /></svg>;
    }
    if (type === 'media') {
        return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
    }
    if (type === 'schedule') {
        return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h18" /><path d="M8 3v4M16 3v4" /><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M7 11h4M7 15h4M13 11h4M13 15h4" /></svg>;
    }
    return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></svg>;
}

function Header(){
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { isAuthenticated, logout, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleNotificationsClick = () => {
        if (!isAuthenticated) {
            const redirect = createSignInRedirect(location, 'Увійдіть, щоб переглядати сповіщення.');
            navigate(redirect.to, redirect.options);
            return;
        }

        setIsNotificationsOpen((current) => !current);
    };

    const handleNotificationsAuthExpired = (message) => {
        logout();
        setIsNotificationsOpen(false);
        const redirect = createSignInRedirect(location, message);
        navigate(redirect.to, redirect.options);
    };

    const getDesktopNavLinkClassName = ({ isActive }) => (
        cn(desktopNavLinkBaseClass, isActive ? desktopNavLinkActiveClass : desktopNavLinkInactiveClass)
    );

    const getMobileNavLinkClassName = ({ isActive }) => (
        cn(mobileNavLinkBaseClass, isActive ? mobileNavLinkActiveClass : mobileNavLinkInactiveClass)
    );

    return(
        <>
        <header className="sticky top-0 z-50 w-full border-b border-border bg-white/90 shadow-[0_1px_0_rgb(15_23_42/0.03)] backdrop-blur-xl supports-backdrop-filter:bg-white/75">
            <AmiContainer as="nav" className="grid min-h-(--header-height) grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 bg-transparent font-sans max-[1020px]:flex max-[1020px]:gap-3">
                <Link to="/main" className="inline-flex shrink-0 items-center gap-3 text-ink no-underline">
                    <h1 className="m-0 flex items-baseline gap-1.5 font-sans text-xl/7 font-black max-[520px]:text-lg/6">
                        <span className="text-accent-strong">AMI</span>
                        <span>Portal</span>
                    </h1>
                </Link>
                <ul className="m-0 flex min-w-0 list-none items-center justify-center gap-2.5 p-0 max-[1020px]:flex-1 max-[1020px]:justify-start max-[1020px]:overflow-x-auto max-[720px]:hidden">
                    <li><NavLink to="/main" className={getDesktopNavLinkClassName}>Головна</NavLink></li>
                    <li><NavLink to="/forum" className={getDesktopNavLinkClassName}>Форум</NavLink></li>                
                    <li><NavLink to="/schedule" className={getDesktopNavLinkClassName}>Розклад</NavLink></li>
                    <li><NavLink to="/media" className={getDesktopNavLinkClassName}>Медіатека</NavLink></li>
                    <li><NavLink to="/course-map" className={getDesktopNavLinkClassName}>Карта курсів</NavLink></li>
                    <li><NavLink to="/about-specialties" className={getDesktopNavLinkClassName}>Про спеціальності</NavLink></li>
                </ul>
                <div className="inline-flex items-center gap-3 max-[520px]:gap-2 ml-auto">
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            className="ami-topbar-action"
                            onClick={handleNotificationsClick}
                            aria-label="Сповіщення"
                            aria-expanded={isNotificationsOpen}
                            aria-controls="notification-popup"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="M12 21.5a2.6 2.6 0 0 0 2.43-1.7H9.57A2.6 2.6 0 0 0 12 21.5Zm7.05-5.4-1.24-1.8V10a5.84 5.84 0 0 0-4.63-5.75V3.7a1.18 1.18 0 0 0-2.36 0v.55A5.84 5.84 0 0 0 6.19 10v4.3l-1.24 1.8A1.15 1.15 0 0 0 5.9 17.9h12.2a1.15 1.15 0 0 0 .95-1.8ZM8.1 15.9l.09-.13V10a3.81 3.81 0 0 1 7.62 0v5.77l.09.13H8.1Z" fill="currentColor" />
                            </svg>
                        </button>
                        <NotificationPopup
                            id="notification-popup"
                            isOpen={isNotificationsOpen}
                            onClose={() => setIsNotificationsOpen(false)}
                            onAuthExpired={handleNotificationsAuthExpired}
                        />
                    </div>
                    <Link to="/profile" className="ami-topbar-action" aria-label={user ? 'Профіль' : 'Увійти до профілю'}>
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                            <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </Link>
                </div>
            </AmiContainer>
        </header>
        <nav className="ami-mobile-nav fixed inset-x-3.5 bottom-2.5 z-50 min-h-16 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_3.75rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1 rounded-ami border border-border bg-surface-strong p-1.5 shadow-[0_8px_28px_rgb(15_23_42/0.08)]" aria-label="Основна мобільна навігація">
                <NavLink to="/main" className={getMobileNavLinkClassName}>
                    <BottomIcon type="home" />
                    Головна
                </NavLink>
                <NavLink to="/forum" className={getMobileNavLinkClassName}>
                    <BottomIcon type="forum" />
                    Форум
                </NavLink>
                <NavLink to="/schedule" className={getMobileNavLinkClassName}>
                    <BottomIcon type="schedule" />
                    Розклад
                </NavLink>
                <NavLink to="/media" className={getMobileNavLinkClassName}>
                    <BottomIcon type="media" />
                    Медіатека
                </NavLink>
                <NavLink to="/profile" className={getMobileNavLinkClassName}>
                    <BottomIcon type="profile" />
                    Профіль
                </NavLink>
            </nav>
        </>
    );
}

export default Header;
