import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/auth-context.js';
import StatusMessage from '../../../components/StatusMessage/StatusMessage';
import { getStoredToken, getTokenFromSearch } from '../../../auth/storage.js';
import { AmiButton } from '../../../ui/ami.jsx';
import { cn } from '../../../ui/cn.js';

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" />
    </svg>
  );
}

const Authenticate = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, authenticateWithToken } = useContext(AuthContext);

  const from = location.state?.from || '/profile';
  const routeMessage = location.state?.message || '';

  useEffect(() => {
    const token = getTokenFromSearch(location.search);

    if (token) {
      authenticateWithToken(token).then((result) => {
        navigate(result.success ? from : '/signin', { replace: true });
      });
    }
  }, [location.search, from, navigate, authenticateWithToken]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          const hasToken = getStoredToken();
          if (!hasToken) {
            throw new Error('Token not stored properly after login');
          }
          navigate(from, { replace: true });
        }, 1200);
      } else {
        console.error('Не вдалося увійти:', result.error);
        setLoginError(result.error || 'Невірний email або пароль');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Не вдалося увійти. Перевірте дані та спробуйте ще раз.');
      setIsSubmitting(false);
    }
  };

  const fieldClass = "h-13 w-full rounded-ami border border-border bg-white px-4 text-base/7 font-bold text-ink outline-hidden transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15";

  return (
    <div className="min-h-dvh bg-page text-ink">
      {showPopup && (
        <div
          role="status"
          aria-live="polite"
          className="ami-elevated ami-overlay-motion fixed left-1/2 top-5 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-ami border border-green-200 bg-green-50 px-5 py-3 text-sm/6 font-black text-green-800"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="m8 12.5 2.7 2.7L16 9.8" />
          </svg>
          Успішна автентифікація
        </div>
      )}

      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* DECORATIVE ASIDE */}
        <aside className="relative hidden overflow-hidden bg-linear-to-br from-accent via-accent-strong to-accent-hot p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-40 -top-40 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute right-16 top-1/3 size-48 rounded-full border border-white/20" aria-hidden="true" />
          <div className="pointer-events-none absolute right-28 top-1/3 size-32 rounded-full border border-white/30 [translate:0_2rem]" aria-hidden="true" />

          <Link to="/main" className="relative inline-flex w-fit items-center gap-2 rounded-ami border border-white/30 bg-white/10 px-4 py-3 text-xl/7 font-black text-white no-underline backdrop-blur transition hover:bg-white/15">
            <span className="grid size-7 place-items-center rounded-md bg-white text-accent-strong" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2.7 20 6.1v5.8c0 5.1-3.3 8.4-8 9.9-4.7-1.5-8-4.8-8-9.9V6.1l8-3.4Z" />
                <path d="M8.4 13.6 12 7.4l3.6 6.2M9.7 11.5h4.6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </span>
            <span>AMI Portal</span>
          </Link>

          <div className="relative">
            <h2 className="m-0 font-sans text-[clamp(2.25rem,3.5vw,3.5rem)]/[1.05] font-black text-white">
              Заходь у свій кабінет ФПМІ
            </h2>
            <p className="m-0 mt-5 max-w-md text-base/7 font-bold text-white/85 md:text-lg/8">
              Пости, матеріали й профіль залишаються там, де ти їх залишив.
            </p>
          </div>

          <ul className="relative m-0 grid list-none gap-3 p-0">
            {[
              { label: 'Форум', desc: 'Питання по парах і сесії' },
              { label: 'Медіатека', desc: 'Конспекти, відео, корисні лінки' },
              { label: 'Карта курсів', desc: 'Предмети по семестрах' },
            ].map(({ label, desc }) => (
              <li key={label} className="flex items-start gap-3 rounded-ami border border-white/60 bg-white/92 p-3 text-ink shadow-[0_14px_36px_rgb(39_20_24/0.14)]">
                <span className="grid size-9 shrink-0 place-items-center rounded-ami bg-accent text-white shadow-[0_10px_24px_rgb(155_77_87/0.24)]" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <strong className="block font-sans text-base/6 font-black text-ink">{label}</strong>
                  <span className="block text-sm/5 font-bold text-muted">{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* FORM */}
        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10" aria-labelledby="signin-title">
          <div className="w-full max-w-md">
            <Link to="/main" className="mb-8 inline-flex items-center gap-2 rounded-ami border border-accent/30 bg-white px-4 py-3 text-lg/6 font-black text-ink no-underline transition hover:border-accent hover:bg-accent-soft lg:hidden">
              <span className="text-accent">AMI</span>
              <strong>Portal</strong>
            </Link>

            <h1 id="signin-title" className="m-0 font-sans text-3xl/10 font-black text-ink sm:text-4xl/12">
              Раді знову бачити
            </h1>
            <p className="m-0 mt-2 text-sm/6 font-bold text-muted sm:text-base/7">
              Увійди, щоб продовжити там, де зупинився.
            </p>

            <form className="mt-7 grid gap-4" onSubmit={handleSubmit} noValidate>
              {routeMessage && <StatusMessage type="info" message={routeMessage} />}
              {loginError && <StatusMessage type="error" message={loginError} onDismiss={() => setLoginError('')} />}

              <div className="grid gap-2">
                <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted" htmlFor="signin-email">
                  Електронна пошта
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>
                  <input
                    id="signin-email"
                    type="email"
                    name="email"
                    placeholder="student@lnu.edu.ua"
                    value={formData.email}
                    onChange={handleChange}
                    className={cn(fieldClass, 'pl-12')}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted" htmlFor="signin-password">
                  Пароль
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Ваш пароль"
                    value={formData.password}
                    onChange={handleChange}
                    className={cn(fieldClass, 'pl-12 pr-14')}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                    className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-ami border border-transparent bg-transparent text-muted transition duration-200 hover:border-border hover:bg-soft hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                  >
                    <EyeIcon open={!showPassword} />
                  </button>
                </div>
              </div>

              <AmiButton type="submit" size="lg" loading={isSubmitting} className="w-full">
                Увійти
              </AmiButton>

              <p className="m-0 text-center text-sm/6 font-bold text-muted">
                Немає акаунту?{' '}
                <Link to="/signup" className="font-black text-accent-strong underline-offset-4 hover:underline">
                  Зареєструватися
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Authenticate;
